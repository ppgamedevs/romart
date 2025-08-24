import { prisma } from "@artfromromania/db"
import { hashIdentifier } from "@artfromromania/crypto"
import { deleteFromStorage } from "@artfromromania/storage"
import { logAudit } from "../moderation/service"

export async function processErasureRequest(requestId: string) {
  try {
    // Update request status to processing
    await prisma.deletionRequest.update({
      where: { id: requestId },
      data: { status: "PROCESSING" }
    })

    const deletionRequest = await prisma.deletionRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          include: {
            addresses: true,
            orders: {
              include: {
                shippingAddress: true,
                billingAddress: true
              }
            },
            consents: true,
            legalAcceptances: true,
            digitalEntitlements: true,
            artist: {
              include: {
                artworks: true,
                images: true
              }
            }
          }
        }
      }
    })

    if (!deletionRequest || !deletionRequest.user) {
      throw new Error("Deletion request or user not found")
    }

    const user = deletionRequest.user
    const userId = user.id
    const formerEmail = user.email

    // 1. Handle Artist data
    if (user.artist) {
      // Unpublish all artworks
      await prisma.artwork.updateMany({
        where: { artistId: user.artist.id },
        data: { status: "ARCHIVED" }
      })

      // Delete artist images from storage
      for (const image of user.artist.images) {
        try {
          if (image.storageKey) {
            await deleteFromStorage(image.storageKey, "public")
          }
        } catch (error) {
          console.warn(`Failed to delete artist image ${image.storageKey}:`, error)
        }
      }

      // Update artist record
      await prisma.artist.update({
        where: { id: user.artist.id },
        data: {
          displayName: "Deleted Artist",
          banned: true,
          shadowbanned: true,
          bio: "{}",
          statement: "{}",
          locationCity: null,
          locationCountry: null,
          socials: "{}",
          education: "[]",
          exhibitions: "[]",
          awards: "[]"
        }
      })
    }

    // 2. Handle KYC documents (delete from storage)
    const kycVerification = await prisma.kycVerification.findUnique({
      where: { artistId: user.artist?.id }
    })

    if (kycVerification) {
      const kycImages = [kycVerification.frontImageUrl, kycVerification.backImageUrl, kycVerification.selfieImageUrl]
      
      for (const imageUrl of kycImages) {
        if (imageUrl) {
          try {
            // Extract key from URL
            const key = imageUrl.split('/').pop()
            if (key) {
              await deleteFromStorage(key, "private")
            }
          } catch (error) {
            console.warn(`Failed to delete KYC image ${imageUrl}:`, error)
          }
        }
      }

      // Delete KYC record
      await prisma.kycVerification.delete({
        where: { artistId: user.artist?.id }
      })
    }

    // 3. Handle Digital Entitlements (mark as inactive)
    await prisma.digitalEntitlement.updateMany({
      where: { userId },
      data: { expiresAt: new Date() }
    })

    // 4. Anonymize Orders (preserve fiscal data)
    for (const order of user.orders) {
      // Anonymize shipping and billing addresses
      if (order.shippingAddress) {
        await prisma.address.update({
          where: { id: order.shippingAddress.id },
          data: {
            firstName: "Deleted",
            lastName: "User",
            company: null,
            addressLine1: "Deleted",
            addressLine2: null,
            city: "Deleted",
            region: null,
            postalCode: "00000",
            country: "RO",
            phone: null,
            phoneEncId: null
          }
        })
      }

      if (order.billingAddress) {
        await prisma.address.update({
          where: { id: order.billingAddress.id },
          data: {
            firstName: "Deleted",
            lastName: "User",
            company: null,
            addressLine1: "Deleted",
            addressLine2: null,
            city: "Deleted",
            region: null,
            postalCode: "00000",
            country: "RO",
            phone: null,
            phoneEncId: null
          }
        })
      }
    }

    // 5. Anonymize User addresses
    await prisma.address.updateMany({
      where: { userId },
      data: {
        firstName: "Deleted",
        lastName: "User",
        company: null,
        addressLine1: "Deleted",
        addressLine2: null,
        city: "Deleted",
        region: null,
        postalCode: "00000",
        country: "RO",
        phone: null,
        phoneEncId: null
      }
    })

    // 6. Delete PII cipher records
    await prisma.piiCipher.deleteMany({
      where: {
        entityType: "Address",
        entityId: {
          in: user.addresses.map(addr => addr.id)
        }
      }
    })

    // 7. Anonymize User record
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: null,
        name: null,
        image: null,
        deletedAt: new Date(),
        anonymizedAt: new Date(),
        deletionReason: deletionRequest.reason
      }
    })

    // 8. Create erasure tombstone
    if (formerEmail) {
      const emailHash = hashIdentifier(formerEmail)
      
      await prisma.erasureTombstone.create({
        data: {
          emailHash,
          userId,
          reason: deletionRequest.reason
        }
      })
    }

    // 9. Update deletion request
    await prisma.deletionRequest.update({
      where: { id: requestId },
      data: {
        status: "DONE",
        processedAt: new Date()
      }
    })

    // 10. Log audit action
    await logAudit({
      actorId: "system",
      action: "PRIVACY_ERASURE_DONE",
      entityType: "USER",
      entityId: userId,
      data: {
        requestId,
        formerEmail,
        reason: deletionRequest.reason
      }
    })

    return { success: true, userId, formerEmail }
  } catch (error) {
    console.error("Erasure processing failed:", error)

    // Update request with error
    await prisma.deletionRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        error: error instanceof Error ? error.message : "Unknown error",
        processedAt: new Date()
      }
    })

    throw error
  }
}

export async function replayErasures() {
  try {
    const tombstones = await prisma.erasureTombstone.findMany({
      where: {
        userId: { not: null }
      }
    })

    let processed = 0
    for (const tombstone of tombstones) {
      if (tombstone.userId) {
        // Check if user exists and is not already anonymized
        const user = await prisma.user.findUnique({
          where: { id: tombstone.userId }
        })

        if (user && !user.anonymizedAt) {
          // Re-apply erasure
          await processErasureRequest(tombstone.id)
          processed++
        }
      }
    }

    return { success: true, processed }
  } catch (error) {
    console.error("Replay erasures failed:", error)
    throw error
  }
}
