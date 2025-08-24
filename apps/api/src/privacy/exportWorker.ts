import { prisma } from "@artfromromania/db"
import { createSignedDownloadUrl } from "@artfromromania/storage"
import { decryptPII } from "@artfromromania/crypto"
import { stringify } from "csv-stringify/sync"
import { createWriteStream } from "fs"
import { mkdir, writeFile } from "fs/promises"
import { join } from "path"
import { pipeline } from "stream/promises"
import archiver from "archiver"

export async function processExportTask(taskId: string) {
  try {
    // Update task status to processing
    await prisma.dataExportTask.update({
      where: { id: taskId },
      data: { status: "PROCESSING" }
    })

    const task = await prisma.dataExportTask.findUnique({
      where: { id: taskId },
      include: { user: true }
    })

    if (!task || !task.user) {
      throw new Error("Task or user not found")
    }

    const userId = task.userId
    const exportData: any = {}

    // Fetch user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        addresses: {
          include: {
            phoneCipher: true
          }
        },
        orders: {
          include: {
            items: {
              include: {
                artwork: true,
                edition: true,
                artist: true
              }
            },
            shippingAddress: true,
            billingAddress: true
          }
        },
        consents: true,
        legalAcceptances: {
          include: {
            doc: true
          }
        },
        digitalEntitlements: true
      }
    })

    if (!user) {
      throw new Error("User not found")
    }

    // Decrypt PII data
    const userData = {
      ...user,
      addresses: user.addresses.map(addr => ({
        ...addr,
        phone: addr.phoneCipher ? decryptPII(addr.phoneCipher.iv, addr.phoneCipher.ciphertext, addr.phoneCipher.tag) : addr.phone
      }))
    }

    // Prepare JSON data
    exportData.user = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt
    }

    exportData.addresses = userData.addresses.map(addr => ({
      id: addr.id,
      type: addr.type,
      firstName: addr.firstName,
      lastName: addr.lastName,
      company: addr.company,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2,
      city: addr.city,
      region: addr.region,
      postalCode: addr.postalCode,
      country: addr.country,
      phone: addr.phone,
      isBusiness: addr.isBusiness,
      vatId: addr.vatId,
      createdAt: addr.createdAt
    }))

    exportData.orders = userData.orders.map(order => ({
      id: order.id,
      status: order.status,
      totalAmount: order.totalAmount,
      currency: order.currency,
      createdAt: order.createdAt,
      items: order.items.map(item => ({
        id: item.id,
        kind: item.kind,
        quantity: item.quantity,
        unitAmount: item.unitAmount,
        subtotal: item.subtotal,
        artworkTitle: item.artwork?.title,
        artistName: item.artist?.displayName
      }))
    }))

    exportData.consents = userData.consents.map(consent => ({
      id: consent.id,
      kind: consent.kind,
      granted: consent.granted,
      source: consent.source,
      country: consent.country,
      createdAt: consent.createdAt
    }))

    exportData.legalAcceptances = userData.legalAcceptances.map(acceptance => ({
      id: acceptance.id,
      kind: acceptance.doc.kind,
      version: acceptance.version,
      acceptedAt: acceptance.createdAt
    }))

    exportData.digitalEntitlements = userData.digitalEntitlements.map(entitlement => ({
      id: entitlement.id,
      orderId: entitlement.orderId,
      editionId: entitlement.editionId,
      token: entitlement.token,
      maxDownloads: entitlement.maxDownloads,
      downloadsCount: entitlement.downloadsCount,
      expiresAt: entitlement.expiresAt,
      lastDownloadedAt: entitlement.lastDownloadedAt,
      createdAt: entitlement.createdAt
    }))

    // Create temporary directory
    const tempDir = join(process.cwd(), "temp", "exports", taskId)
    await mkdir(tempDir, { recursive: true })

    // Write JSON file
    const jsonPath = join(tempDir, "user.json")
    await writeFile(jsonPath, JSON.stringify(exportData, null, 2))

    // Create CSV files
    const csvFiles = [
      {
        name: "orders.csv",
        data: userData.orders.map(order => ({
          id: order.id,
          status: order.status,
          totalAmount: order.totalAmount,
          currency: order.currency,
          createdAt: order.createdAt
        }))
      },
      {
        name: "order_items.csv",
        data: userData.orders.flatMap(order => 
          order.items.map(item => ({
            orderId: order.id,
            id: item.id,
            kind: item.kind,
            quantity: item.quantity,
            unitAmount: item.unitAmount,
            subtotal: item.subtotal,
            artworkTitle: item.artwork?.title,
            artistName: item.artist?.displayName
          }))
        )
      },
      {
        name: "addresses.csv",
        data: userData.addresses.map(addr => ({
          id: addr.id,
          type: addr.type,
          firstName: addr.firstName,
          lastName: addr.lastName,
          company: addr.company,
          addressLine1: addr.addressLine1,
          addressLine2: addr.addressLine2,
          city: addr.city,
          region: addr.region,
          postalCode: addr.postalCode,
          country: addr.country,
          phone: addr.phone,
          isBusiness: addr.isBusiness,
          vatId: addr.vatId,
          createdAt: addr.createdAt
        }))
      },
      {
        name: "consents.csv",
        data: userData.consents.map(consent => ({
          id: consent.id,
          kind: consent.kind,
          granted: consent.granted,
          source: consent.source,
          country: consent.country,
          createdAt: consent.createdAt
        }))
      },
      {
        name: "downloads.csv",
        data: userData.digitalEntitlements.map(entitlement => ({
          id: entitlement.id,
          orderId: entitlement.orderId,
          editionId: entitlement.editionId,
          token: entitlement.token,
          maxDownloads: entitlement.maxDownloads,
          downloadsCount: entitlement.downloadsCount,
          expiresAt: entitlement.expiresAt,
          lastDownloadedAt: entitlement.lastDownloadedAt,
          createdAt: entitlement.createdAt
        }))
      }
    ]

    // Write CSV files
    for (const csvFile of csvFiles) {
      const csvPath = join(tempDir, csvFile.name)
      const csvContent = stringify(csvFile.data, { header: true })
      await writeFile(csvPath, csvContent)
    }

    // Create ZIP file
    const zipPath = join(tempDir, "export.zip")
    const output = createWriteStream(zipPath)
    const archive = archiver("zip", { zlib: { level: 9 } })

    await new Promise<void>((resolve, reject) => {
      output.on("close", () => resolve())
      archive.on("error", (err) => reject(err))
      archive.pipe(output)

      // Add files to archive
      archive.file(jsonPath, { name: "user.json" })
      for (const csvFile of csvFiles) {
        archive.file(join(tempDir, csvFile.name), { name: csvFile.name })
      }

      archive.finalize()
    })

    // Upload to storage
    const storageKey = `private/exports/${userId}/${taskId}.zip`
    const { uploadToPrivateStorage } = await import("@artfromromania/storage")
    
    const zipBuffer = await import("fs").then(fs => fs.readFileSync(zipPath))
    await uploadToPrivateStorage(storageKey, zipBuffer, "application/zip")

    // Calculate expiration
    const ttlSeconds = parseInt(process.env.DATA_EXPORT_TTL_SECONDS || "3600")
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000)

    // Update task
    await prisma.dataExportTask.update({
      where: { id: taskId },
      data: {
        status: "DONE",
        storageKey,
        expiresAt,
        completedAt: new Date()
      }
    })

    // Clean up temp files
    await import("fs").then(fs => fs.rmSync(tempDir, { recursive: true, force: true }))

    return { success: true, storageKey, expiresAt }
  } catch (error) {
    console.error("Export processing failed:", error)

    // Update task with error
    await prisma.dataExportTask.update({
      where: { id: taskId },
      data: {
        status: "FAILED",
        error: error instanceof Error ? error.message : "Unknown error",
        completedAt: new Date()
      }
    })

    throw error
  }
}
