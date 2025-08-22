import { z } from "zod"
import { slugify } from "../index"

// Countries list with ISO2 codes
export const COUNTRIES = [
  { code: "RO", label: "Romania" },
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "IT", label: "Italy" },
  { code: "ES", label: "Spain" },
  { code: "NL", label: "Netherlands" },
  { code: "BE", label: "Belgium" },
  { code: "AT", label: "Austria" },
  { code: "CH", label: "Switzerland" },
  { code: "SE", label: "Sweden" },
  { code: "NO", label: "Norway" },
  { code: "DK", label: "Denmark" },
  { code: "FI", label: "Finland" },
  { code: "PL", label: "Poland" },
  { code: "CZ", label: "Czech Republic" },
  { code: "HU", label: "Hungary" },
  { code: "BG", label: "Bulgaria" },
  { code: "HR", label: "Croatia" },
  { code: "SI", label: "Slovenia" },
  { code: "SK", label: "Slovakia" },
  { code: "EE", label: "Estonia" },
  { code: "LV", label: "Latvia" },
  { code: "LT", label: "Lithuania" },
  { code: "IE", label: "Ireland" },
  { code: "PT", label: "Portugal" },
  { code: "GR", label: "Greece" },
  { code: "CY", label: "Cyprus" },
  { code: "MT", label: "Malta" },
  { code: "LU", label: "Luxembourg" },
] as const

export const KYC_DOCUMENT_TYPES = [
  { value: "ID_CARD", label: "Identity Card" },
  { value: "PASSPORT", label: "Passport" },
  { value: "DRIVER_LICENSE", label: "Driver's License" },
  { value: "OTHER", label: "Other Document" },
] as const

// Utility functions
export function normalizeUrl(url: string | undefined): string | undefined {
  if (!url) return undefined
  
  let normalized = url.trim()
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized
  }
  
  // Remove UTM parameters
  try {
    const urlObj = new URL(normalized)
    urlObj.searchParams.delete('utm_source')
    urlObj.searchParams.delete('utm_medium')
    urlObj.searchParams.delete('utm_campaign')
    urlObj.searchParams.delete('utm_term')
    urlObj.searchParams.delete('utm_content')
    return urlObj.toString()
  } catch {
    return normalized
  }
}

export function safeSlug(input: string): string {
  return slugify(input).substring(0, 64)
}

export function coerceArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

// Step 1: Basic Information
export const Step1BasicSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters").max(80, "Display name must be less than 80 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters").max(64, "Slug must be less than 64 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  locationCity: z.string().max(80, "City must be less than 80 characters").optional(),
  locationCountry: z.enum(COUNTRIES.map(c => c.code) as [string, ...string[]], {
    errorMap: () => ({ message: "Please select a valid country" })
  }),
  avatarUrl: z.string().url("Please enter a valid URL").optional(),
  coverUrl: z.string().url("Please enter a valid URL").optional(),
})

// Step 2: Bio & Statement
export const Step2BioSchema = z.object({
  bio: z.string().max(800, "Bio must be less than 800 characters").optional(),
  statement: z.string().max(1200, "Artist statement must be less than 1200 characters").optional(),
})

// Step 3: Experience
export const EducationSchema = z.object({
  school: z.string().min(2, "School name must be at least 2 characters").max(120, "School name must be less than 120 characters"),
  program: z.string().max(120, "Program name must be less than 120 characters").optional(),
  year: z.number().min(1900).max(new Date().getFullYear()).optional(),
})

export const ExhibitionSchema = z.object({
  title: z.string().min(2, "Exhibition title must be at least 2 characters").max(160, "Exhibition title must be less than 160 characters"),
  venue: z.string().max(160, "Venue name must be less than 160 characters").optional(),
  year: z.number().min(1900).max(new Date().getFullYear()).optional(),
})

export const AwardSchema = z.object({
  title: z.string().min(2, "Award title must be at least 2 characters").max(160, "Award title must be less than 160 characters"),
  org: z.string().max(160, "Organization name must be less than 160 characters").optional(),
  year: z.number().min(1900).max(new Date().getFullYear()).optional(),
})

export const Step3ExperienceSchema = z.object({
  education: z.array(EducationSchema).max(10, "Maximum 10 education entries"),
  exhibitions: z.array(ExhibitionSchema).max(10, "Maximum 10 exhibition entries"),
  awards: z.array(AwardSchema).max(10, "Maximum 10 award entries"),
})

// Step 4: Social Media
export const Step4SocialsSchema = z.object({
  website: z.string().url("Please enter a valid URL").optional(),
  instagram: z.string().max(100, "Instagram handle must be less than 100 characters").optional(),
  facebook: z.string().max(100, "Facebook handle must be less than 100 characters").optional(),
  x: z.string().max(100, "X (Twitter) handle must be less than 100 characters").optional(),
  tiktok: z.string().max(100, "TikTok handle must be less than 100 characters").optional(),
  youtube: z.string().max(100, "YouTube handle must be less than 100 characters").optional(),
})

// Step 5: KYC
export const KycStepSchema = z.object({
  country: z.enum(COUNTRIES.map(c => c.code) as [string, ...string[]], {
    errorMap: () => ({ message: "Please select a valid country" })
  }),
  documentType: z.enum(KYC_DOCUMENT_TYPES.map(d => d.value) as [string, ...string[]], {
    errorMap: () => ({ message: "Please select a document type" })
  }),
  docLast4: z.string().regex(/^\d{2,4}$/, "Please enter 2-4 digits").optional(),
  frontImageUrl: z.string().url("Please enter a valid URL").optional(),
  backImageUrl: z.string().url("Please enter a valid URL").optional(),
  selfieImageUrl: z.string().url("Please enter a valid URL").optional(),
})

// Completion score calculation
export function computeArtistCompletionScore(artist: {
  displayName?: string | null
  slug?: string | null
  locationCity?: string | null
  locationCountry?: string | null
  avatarUrl?: string | null
  coverUrl?: string | null
  bio?: string | null
  statement?: string | null
  education?: any
  exhibitions?: any
  awards?: any
  website?: string | null
  instagram?: string | null
  facebook?: string | null
  x?: string | null
  tiktok?: string | null
  youtube?: string | null
  kycStatus?: string | null
}): number {
  let score = 0

  // Basic Information (30 points)
  if (artist.displayName) score += 5
  if (artist.slug) score += 5
  if (artist.locationCity) score += 3
  if (artist.locationCountry) score += 3
  if (artist.avatarUrl) score += 7
  if (artist.coverUrl) score += 7

  // Bio & Statement (20 points)
  if (artist.bio && artist.bio.length > 50) score += 10
  if (artist.statement && artist.statement.length > 100) score += 10

  // Experience (25 points)
  const education = coerceArray(artist.education)
  const exhibitions = coerceArray(artist.exhibitions)
  const awards = coerceArray(artist.awards)
  
  if (education.length > 0) score += 8
  if (exhibitions.length > 0) score += 8
  if (awards.length > 0) score += 9

  // Social Media (5 points)
  const socials = [artist.website, artist.instagram, artist.facebook, artist.x, artist.tiktok, artist.youtube]
  const hasSocials = socials.some(s => s && s.trim().length > 0)
  if (hasSocials) score += 5

  // Images (10 points)
  const images = [artist.avatarUrl, artist.coverUrl]
  const imageCount = images.filter(img => img && img.trim().length > 0).length
  score += Math.min(imageCount * 5, 10)

  // KYC Submitted (10 points)
  if (artist.kycStatus && artist.kycStatus !== 'PENDING') score += 10

  return Math.min(score, 100)
}

export type Step1Basic = z.infer<typeof Step1BasicSchema>
export type Step2Bio = z.infer<typeof Step2BioSchema>
export type Step3Experience = z.infer<typeof Step3ExperienceSchema>
export type Step4Socials = z.infer<typeof Step4SocialsSchema>
export type KycStep = z.infer<typeof KycStepSchema>
