"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getAuthSession } from "@/auth/utils"
import { prisma } from "@artfromromania/db"
import { 
  ArtworkBaseSchema, 
  EditionPrintSchema, 
  EditionDigitalSchema,
  canPublish,
  normalizeDimensions,
  slugify,
  generateUniqueSlug,
  suggestPrintEditionsFromOriginal
} from "@artfromromania/shared"
import { createArtworkModerationItem } from "@/lib/moderation"
import { ArtworkStatus, ArtworkKind, EditionType } from "@prisma/client"

// Simple rate limiter (temporary)
const artworkLimiter = {
  check: async (action: string) => {
    // For now, just pass through
    return true
  }
}

// Helper to get current artist
async function getCurrentArtist() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const artist = await prisma.artist.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      displayName: true,
      slug: true,
      kycStatus: true,
      completionScore: true,
    }
  })

  if (!artist) {
    throw new Error("Artist profile not found")
  }

  return artist
}

// Helper to verify artwork ownership
async function verifyArtworkOwnership(artworkId: string) {
  const artist = await getCurrentArtist()
  
  const artwork = await prisma.artwork.findFirst({
    where: {
      id: artworkId,
      artistId: artist.id,
    }
  })

  if (!artwork) {
    throw new Error("Artwork not found or access denied")
  }

  return { artist, artwork }
}

// Create new artwork
export async function createArtwork(kind: string) {
  await artworkLimiter.check("create")
  
  const artist = await getCurrentArtist()
  
  const artwork = await prisma.artwork.create({
    data: {
      artistId: artist.id,
      kind: kind as ArtworkKind,
      status: ArtworkStatus.DRAFT,
      slug: `temp-${Date.now()}`, // Temporary slug
      title: "",
      priceAmount: 0,
      priceCurrency: "EUR",
    }
  })

  revalidatePath("/studio/artworks")
  redirect(`/studio/artworks/${artwork.id}/edit`)
}

// Save artwork details
export async function saveDetails(artworkId: string, formData: FormData) {
  await artworkLimiter.check("save")
  
  const { artist, artwork } = await verifyArtworkOwnership(artworkId)
  
  const rawData = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    year: formData.get("year") ? parseInt(formData.get("year") as string) : undefined,
    medium: formData.get("medium") as string,
    category: formData.get("category") as string,
    widthCm: formData.get("widthCm") ? parseFloat(formData.get("widthCm") as string) : undefined,
    heightCm: formData.get("heightCm") ? parseFloat(formData.get("heightCm") as string) : undefined,
    depthCm: formData.get("depthCm") ? parseFloat(formData.get("depthCm") as string) : undefined,
    framed: formData.get("framed") === "true",
    priceAmount: parseInt(formData.get("priceAmount") as string),
    priceCurrency: formData.get("priceCurrency") as string || "EUR",
  }

  // Validate input
  const validatedData = ArtworkBaseSchema.parse({
    ...rawData,
    kind: artwork.kind, // Keep existing kind
  })

  // Normalize dimensions
  const normalizedDimensions = normalizeDimensions({
    width: validatedData.widthCm,
    height: validatedData.heightCm,
    depth: validatedData.depthCm,
  })

  // Generate stable slug
  const baseSlug = slugify(validatedData.title)
  const artistSlug = slugify(artist.displayName)
  const yearSuffix = validatedData.year ? `-${validatedData.year}` : ""
  const proposedSlug = `${baseSlug}-${artistSlug}${yearSuffix}`

  // Check for existing slugs
  const existingSlugs = await prisma.artwork.findMany({
    where: {
      artistId: artist.id,
      slug: { startsWith: proposedSlug },
    },
    select: { slug: true }
  })

  const finalSlug = generateUniqueSlug(
    proposedSlug,
    existingSlugs.map(a => a.slug)
  )

  // Update artwork
  await prisma.artwork.update({
    where: { id: artworkId },
    data: {
      ...validatedData,
      ...normalizedDimensions,
      slug: finalSlug,
    }
  })

  revalidatePath("/studio/artworks")
  revalidatePath(`/studio/artworks/${artworkId}/edit`)
  
  return { success: true }
}

// Add print edition
export async function addEditionPrint(artworkId: string, formData: FormData) {
  await artworkLimiter.check("edition")
  
  await verifyArtworkOwnership(artworkId)
  
  const rawData = {
    sku: formData.get("sku") as string,
    runSize: parseInt(formData.get("runSize") as string),
    available: parseInt(formData.get("available") as string),
    unitAmount: parseInt(formData.get("unitAmount") as string),
    currency: formData.get("currency") as string || "EUR",
    type: "PRINT" as const,
    material: formData.get("material") as "CANVAS" | "METAL",
    sizeName: formData.get("sizeName") as string || undefined,
    widthCm: formData.get("widthCm") ? parseFloat(formData.get("widthCm") as string) : undefined,
    heightCm: formData.get("heightCm") ? parseFloat(formData.get("heightCm") as string) : undefined,
  }

  const validatedData = EditionPrintSchema.parse(rawData)

  await prisma.edition.create({
    data: {
      artworkId,
      ...validatedData,
      type: EditionType.PRINT,
    }
  })

  revalidatePath(`/studio/artworks/${artworkId}/edit`)
  return { success: true }
}

// Update print edition
export async function updateEditionPrint(editionId: string, formData: FormData) {
  await artworkLimiter.check("edition")
  
  const rawData = {
    sku: formData.get("sku") as string,
    runSize: parseInt(formData.get("runSize") as string),
    available: parseInt(formData.get("available") as string),
    unitAmount: parseInt(formData.get("unitAmount") as string),
    currency: formData.get("currency") as string || "EUR",
    type: "PRINT" as const,
  }

  const validatedData = EditionPrintSchema.parse(rawData)

  await prisma.edition.update({
    where: { id: editionId },
    data: {
      ...validatedData,
      type: EditionType.PRINT,
    },
  })

  revalidatePath("/studio/artworks")
  return { success: true }
}

// Add digital edition
export async function addEditionDigital(artworkId: string, formData: FormData) {
  await artworkLimiter.check("edition")
  
  await verifyArtworkOwnership(artworkId)
  
  const rawData = {
    sku: formData.get("sku") as string,
    unitAmount: parseInt(formData.get("unitAmount") as string),
    currency: formData.get("currency") as string || "EUR",
    type: "DIGITAL" as const,
    downloadableUrl: formData.get("downloadableUrl") as string || undefined,
  }

  const validatedData = EditionDigitalSchema.parse(rawData)

  await prisma.edition.create({
    data: {
      artworkId,
      ...validatedData,
      type: EditionType.DIGITAL,
    }
  })

  revalidatePath(`/studio/artworks/${artworkId}/edit`)
  return { success: true }
}

// Delete edition
export async function deleteEdition(editionId: string) {
  await artworkLimiter.check("edition")
  
  await prisma.edition.delete({
    where: { id: editionId },
  })

  revalidatePath("/studio/artworks")
  return { success: true }
}

// Set primary image
export async function setPrimaryImage(artworkId: string, imageId: string) {
  await artworkLimiter.check("image")
  
  await verifyArtworkOwnership(artworkId)
  
  // Reset all images to position > 0
  await prisma.image.updateMany({
    where: { artworkId },
    data: { position: { increment: 1 } }
  })

  // Set the selected image as primary (position 0)
  await prisma.image.update({
    where: { id: imageId },
    data: { position: 0 }
  })

  revalidatePath(`/studio/artworks/${artworkId}/edit`)
  return { success: true }
}

// Reorder images
export async function reorderImages(artworkId: string, imageIds: string[]) {
  await artworkLimiter.check("image")
  
  await verifyArtworkOwnership(artworkId)
  
  // Update positions based on the new order
  for (let i = 0; i < imageIds.length; i++) {
    await prisma.image.update({
      where: { id: imageIds[i] },
      data: { position: i }
    })
  }

  revalidatePath(`/studio/artworks/${artworkId}/edit`)
  return { success: true }
}

// Publish artwork
export async function publishArtwork(artworkId: string) {
  await artworkLimiter.check("publish")
  
  const { artist, artwork } = await verifyArtworkOwnership(artworkId)
  
  // Get artwork with images and editions
  const fullArtwork = await prisma.artwork.findUnique({
    where: { id: artworkId },
    include: {
      images: { orderBy: { position: 'asc' } },
      editions: true,
    }
  })

  if (!fullArtwork) {
    throw new Error("Artwork not found")
  }

  // Check if can publish
  const validation = canPublish({
    artist: {
      kycStatus: artist.kycStatus,
      completionScore: artist.completionScore,
    },
    artwork: {
      title: fullArtwork.title,
      priceAmount: fullArtwork.priceAmount,
      kind: fullArtwork.kind,
      status: fullArtwork.status,
    },
    imagesCount: fullArtwork.images.length,
    hasPrimaryImage: fullArtwork.images.some(img => img.position === 0),
    editions: fullArtwork.editions.map(ed => ({
      unitAmount: ed.unitAmount,
      runSize: ed.runSize || undefined,
      available: ed.available || undefined,
    }))
  })

  if (!validation.ok) {
    throw new Error(`Cannot publish: ${validation.errors.join(", ")}`)
  }

  // Publish the artwork
  await prisma.artwork.update({
    where: { id: artworkId },
    data: {
      status: ArtworkStatus.PUBLISHED,
      publishedAt: new Date(),
    }
  })

  // Create moderation item for the artwork
  try {
    await createArtworkModerationItem(artworkId);
  } catch (error) {
    console.error("Failed to create moderation item:", error);
    // Don't fail the publish if moderation fails
  }

  revalidatePath("/studio/artworks")
  revalidatePath(`/artist/${artist.displayName}`)
  revalidatePath(`/artwork/${fullArtwork.slug}`)
  
  // Trigger on-demand revalidation for cache tags
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/revalidate?secret=${process.env.ON_DEMAND_REVALIDATE_SECRET}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        tags: [`artist:${artist.slug}`, `artwork:${fullArtwork.slug}`] 
      })
    });
    if (!response.ok) {
      console.warn("Failed to trigger revalidation");
    }
  } catch (error) {
    console.warn("Failed to trigger revalidation:", error);
  }
  
  return { success: true }
}

// Unpublish artwork
export async function unpublishArtwork(artworkId: string) {
  await artworkLimiter.check("publish")
  
  const { artist, artwork } = await verifyArtworkOwnership(artworkId)
  
  await prisma.artwork.update({
    where: { id: artworkId },
    data: {
      status: ArtworkStatus.ARCHIVED,
      publishedAt: null,
    }
  })

  revalidatePath("/studio/artworks")
  revalidatePath(`/artist/${artist.displayName}`)
  revalidatePath(`/artwork/${artwork.slug}`)
  
  // Trigger on-demand revalidation for cache tags
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/revalidate?secret=${process.env.ON_DEMAND_REVALIDATE_SECRET}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        tags: [`artist:${artist.slug}`, `artwork:${artwork.slug}`] 
      })
    });
    if (!response.ok) {
      console.warn("Failed to trigger revalidation");
    }
  } catch (error) {
    console.warn("Failed to trigger revalidation:", error);
  }
  
  return { success: true }
}

// Delete artwork
export async function deleteArtwork(artworkId: string) {
  await artworkLimiter.check("delete")
  
  await verifyArtworkOwnership(artworkId)
  
  await prisma.artwork.delete({
    where: { id: artworkId },
  })

  revalidatePath("/studio/artworks")
  redirect("/studio/artworks")
}

// Generate standard print options for ORIGINAL artworks
export async function generateStandardPrints(artworkId: string) {
  await artworkLimiter.check("edition")
  
  const { artist, artwork } = await verifyArtworkOwnership(artworkId)
  
  // Only allow for ORIGINAL artworks
  if (artwork.kind !== "ORIGINAL") {
    throw new Error("Standard prints can only be generated for original artworks")
  }
  
  // Check if artwork has a price
  if (!artwork.priceAmount || artwork.priceAmount <= 0) {
    throw new Error("Artwork must have a price to generate print options")
  }
  
  // Generate suggested print editions
  const suggestedEditions = suggestPrintEditionsFromOriginal(artwork.priceAmount)
  
  // Create editions in database
  const createdEditions = await Promise.all(
    suggestedEditions.map(async (edition) => {
      return await prisma.edition.create({
        data: {
          artworkId,
          sku: edition.sku,
          type: EditionType.PRINT,
          unitAmount: edition.unitAmount,
          currency: "EUR",
          material: edition.material,
          sizeName: edition.sizeName,
          widthCm: edition.widthCm,
          heightCm: edition.heightCm,
          // Set runSize and available to null for open PoD
          runSize: null,
          available: null,
        }
      })
    })
  )
  
  revalidatePath(`/studio/artworks/${artworkId}/edit`)
  return { success: true, count: createdEditions.length }
}
