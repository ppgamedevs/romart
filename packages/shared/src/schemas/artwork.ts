import { z } from "zod"

// Utility function to assert minor units
export function assertMinorUnits(value: number): void {
  if (value < 1) {
    throw new Error("Amount must be at least 1 minor unit (0.01)")
  }
}

// Normalize dimensions to 1 decimal place
export function normalizeDimensions(dimensions: { width?: number; height?: number; depth?: number }) {
  return {
    width: dimensions.width ? Math.round(dimensions.width * 10) / 10 : undefined,
    height: dimensions.height ? Math.round(dimensions.height * 10) / 10 : undefined,
    depth: dimensions.depth ? Math.round(dimensions.depth * 10) / 10 : undefined,
  }
}

// Base artwork schema
export const ArtworkBaseSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(160, "Title must be less than 160 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters").max(80, "Slug must be less than 80 characters").optional(),
  description: z.string().max(2000, "Description must be less than 2000 characters").optional(),
  year: z.number().int().min(1900, "Year must be at least 1900").max(new Date().getFullYear() + 1, "Year cannot be in the future").optional(),
  medium: z.string().max(120, "Medium must be less than 120 characters").optional(),
  category: z.enum(["Painting", "Drawing", "Photography", "Digital"]).optional(),
  widthCm: z.number().min(0, "Width must be positive").optional(),
  heightCm: z.number().min(0, "Height must be positive").optional(),
  depthCm: z.number().min(0, "Depth must be positive").optional(),
  framed: z.boolean().default(false),
  priceAmount: z.number().int().min(1, "Price must be at least 1 cent"),
  priceCurrency: z.string().default("EUR"),
  kind: z.enum(["ORIGINAL", "EDITIONED", "DIGITAL"]),
})

// Edition print schema
export const EditionPrintSchema = z.object({
  sku: z.string().min(1, "SKU is required").max(50, "SKU must be less than 50 characters"),
  runSize: z.number().int().min(1, "Run size must be at least 1"),
  available: z.number().int().min(0, "Available cannot be negative"),
  unitAmount: z.number().int().min(1, "Unit amount must be at least 1 cent"),
  currency: z.string().default("EUR"),
  type: z.literal("PRINT"),
  material: z.enum(["CANVAS", "METAL"]),
  sizeName: z.string().max(40).optional(),
  widthCm: z.number().positive().max(300).optional(),
  heightCm: z.number().positive().max(300).optional(),
}).refine((data) => data.available <= data.runSize, {
  message: "Available cannot exceed run size",
  path: ["available"],
})

// Edition digital schema
export const EditionDigitalSchema = z.object({
  sku: z.string().min(1, "SKU is required").max(50, "SKU must be less than 50 characters"),
  unitAmount: z.number().int().min(1, "Unit amount must be at least 1 cent"),
  currency: z.string().default("EUR"),
  type: z.literal("DIGITAL"),
  downloadableUrl: z.string().url().optional(),
})

// Combined edition schema - using union instead of discriminatedUnion
export const EditionSchema = z.union([
  EditionPrintSchema,
  EditionDigitalSchema,
])

// Publish validation result
export interface PublishValidation {
  ok: boolean
  errors: string[]
}

// Check if artwork can be published
export function canPublish(params: {
  artist: {
    kycStatus: string
    completionScore: number
  }
  artwork: {
    title: string
    priceAmount: number
    kind: string
    status: string
  }
  imagesCount: number
  hasPrimaryImage: boolean
  editions: Array<{
    unitAmount: number
    runSize?: number
    available?: number
  }>
}): PublishValidation {
  const errors: string[] = []

  // KYC validation
  if (params.artist.kycStatus !== "APPROVED") {
    errors.push("KYC verification required - please complete identity verification")
  }

  // Profile completion
  if (params.artist.completionScore < 80) {
    errors.push("Profile must be at least 80% complete")
  }

  // Artwork validation
  if (!params.artwork.title?.trim()) {
    errors.push("Title is required")
  }

  if (params.artwork.priceAmount <= 0) {
    errors.push("Price must be greater than 0")
  }

  if (!params.artwork.kind) {
    errors.push("Artwork type is required")
  }

  // Status validation
  if (!["DRAFT", "ARCHIVED"].includes(params.artwork.status)) {
    errors.push("Only draft or archived artworks can be published")
  }

  // Images validation
  if (params.imagesCount < 1) {
    errors.push("At least one image is required")
  }

  if (!params.hasPrimaryImage) {
    errors.push("Primary image must be set")
  }

  // Editions validation based on kind
  if (params.artwork.kind === "EDITIONED") {
    if (params.editions.length === 0) {
      errors.push("At least one edition is required for editioned artworks")
    } else {
      const validEditions = params.editions.filter(edition => 
        edition.unitAmount > 0 && 
        edition.runSize && 
        edition.available !== undefined &&
        edition.available >= 0 && 
        edition.available <= edition.runSize
      )
      if (validEditions.length === 0) {
        errors.push("At least one valid edition is required")
      }
    }
  }

  if (params.artwork.kind === "DIGITAL") {
    if (params.editions.length === 0) {
      errors.push("At least one digital edition is required")
    } else {
      const validDigitalEditions = params.editions.filter(edition => edition.unitAmount > 0)
      if (validDigitalEditions.length === 0) {
        errors.push("At least one valid digital edition is required")
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  }
}

// Helper function to suggest print editions from original artwork
export function suggestPrintEditionsFromOriginal(originalPriceMinor: number): Array<{ 
  sku: string; 
  material: "CANVAS" | "METAL"; 
  sizeName: string; 
  widthCm: number; 
  heightCm: number; 
  unitAmount: number; 
}> {
  const sizes = [
    { name: "30x40 cm", width: 30, height: 40 },
    { name: "50x70 cm", width: 50, height: 70 },
    { name: "70x100 cm", width: 70, height: 100 },
  ];
  
  const materials: Array<"CANVAS" | "METAL"> = ["CANVAS", "METAL"];
  const results = [];
  
  for (const size of sizes) {
    for (const material of materials) {
      // Base price calculation
      let basePrice: number;
      if (size.name === "30x40 cm") {
        basePrice = Math.max(4900, Math.round(originalPriceMinor * 0.12));
      } else if (size.name === "50x70 cm") {
        basePrice = Math.max(7900, Math.round(originalPriceMinor * 0.18));
      } else { // 70x100 cm
        basePrice = Math.max(12900, Math.round(originalPriceMinor * 0.25));
      }
      
      // METAL adds +20%
      const finalPrice = material === "METAL" 
        ? Math.round(basePrice * 1.2) 
        : basePrice;
      
      // Round to nearest 100 (cents)
      const roundedPrice = Math.round(finalPrice / 100) * 100;
      
      // Generate unique SKU
      const sku = `PRINT-${size.width}x${size.height}-${material.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      
      results.push({
        sku,
        material,
        sizeName: size.name,
        widthCm: size.width,
        heightCm: size.height,
        unitAmount: roundedPrice,
      });
    }
  }
  
  return results;
}

// Types
export type ArtworkBaseInput = z.infer<typeof ArtworkBaseSchema>
export type EditionPrintInput = z.infer<typeof EditionPrintSchema>
export type EditionDigitalInput = z.infer<typeof EditionDigitalSchema>
export type EditionInput = z.infer<typeof EditionSchema>
