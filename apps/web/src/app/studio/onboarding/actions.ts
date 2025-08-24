"use server"

import { getAuthSession } from "@/auth/utils"
import { prisma } from "@artfromromania/db"
import { 
  Step1BasicSchema, 
  Step2BioSchema, 
  Step3ExperienceSchema, 
  Step4SocialsSchema, 
  KycStepSchema,
  computeArtistCompletionScore,
  normalizeUrl,
  safeSlug
} from "@artfromromania/shared"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

// Simple rate limiter (temporary)
const onboardingRateLimiter = {
  limit: async (action: string) => {
    // For now, just pass through
    return { success: true }
  }
}

async function checkRateLimit() {
  const result = await onboardingRateLimiter.limit("onboarding")
  if (!result.success) {
    throw new Error("Too many requests. Please wait a moment and try again.")
  }
}

async function getArtist() {
  const session = await getAuthSession()
  if (!session?.user) {
    throw new Error("Not authenticated")
  }

  const artist = await prisma.artist.findUnique({
    where: { userId: session.user.id }
  })

  if (!artist) {
    throw new Error("Artist profile not found")
  }

  return artist
}

export async function saveStep1Basic(formData: FormData) {
  try {
    await checkRateLimit()
    
    const data = {
      displayName: formData.get("displayName") as string,
      slug: formData.get("slug") as string,
      locationCity: formData.get("locationCity") as string,
      locationCountry: formData.get("locationCountry") as string,
      avatarUrl: formData.get("avatarUrl") as string,
      coverUrl: formData.get("coverUrl") as string,
    }

    const validated = Step1BasicSchema.parse(data)
    const artist = await getArtist()

    // Check if slug is unique (case-insensitive)
    if (artist.slug !== validated.slug) {
      const existingArtist = await prisma.artist.findFirst({
        where: {
          slug: { equals: validated.slug, mode: "insensitive" },
          id: { not: artist.id }
        }
      })

      if (existingArtist) {
        throw new Error("This slug is already taken. Please choose a different one.")
      }
    }

    // Check if slug is locked
    if (artist.slugLockedAt && artist.slug !== validated.slug) {
      throw new Error("Your slug has been locked and cannot be changed.")
    }

    // Update artist
    const updatedArtist = await prisma.artist.update({
      where: { id: artist.id },
      data: {
        displayName: validated.displayName,
        slug: validated.slug,
        locationCity: validated.locationCity || null,
        locationCountry: validated.locationCountry,
        avatarUrl: normalizeUrl(validated.avatarUrl) || null,
        coverUrl: normalizeUrl(validated.coverUrl) || null,
        onboardingStep: 2,
        completionScore: computeArtistCompletionScore({
          ...artist,
          ...validated,
          avatarUrl: normalizeUrl(validated.avatarUrl),
          coverUrl: normalizeUrl(validated.coverUrl),
        })
      }
    })

    revalidatePath("/studio/onboarding")
    redirect("/studio/onboarding/2-bio")
  } catch (error) {
    throw error instanceof Error ? error : new Error("Failed to save basic information")
  }
}

export async function saveStep2Bio(formData: FormData) {
  try {
    await checkRateLimit()
    
    const data = {
      bio: formData.get("bio") as string,
      statement: formData.get("statement") as string,
    }

    const validated = Step2BioSchema.parse(data)
    const artist = await getArtist()

    const updatedArtist = await prisma.artist.update({
      where: { id: artist.id },
      data: {
        bio: validated.bio || null,
        statement: validated.statement || null,
        onboardingStep: 3,
        completionScore: computeArtistCompletionScore({
          ...artist,
          ...validated,
        })
      }
    })

    revalidatePath("/studio/onboarding")
    redirect("/studio/onboarding/3-experience")
  } catch (error) {
    throw error instanceof Error ? error : new Error("Failed to save bio information")
  }
}

export async function saveStep3Experience(formData: FormData) {
  try {
    await checkRateLimit()
    
    const data = {
      education: JSON.parse(formData.get("education") as string || "[]"),
      exhibitions: JSON.parse(formData.get("exhibitions") as string || "[]"),
      awards: JSON.parse(formData.get("awards") as string || "[]"),
    }

    const validated = Step3ExperienceSchema.parse(data)
    const artist = await getArtist()

    const updatedArtist = await prisma.artist.update({
      where: { id: artist.id },
      data: {
        education: validated.education,
        exhibitions: validated.exhibitions,
        awards: validated.awards,
        onboardingStep: 4,
        completionScore: computeArtistCompletionScore({
          ...artist,
          ...validated,
        })
      }
    })

    revalidatePath("/studio/onboarding")
    redirect("/studio/onboarding/4-socials")
  } catch (error) {
    throw error instanceof Error ? error : new Error("Failed to save experience information")
  }
}

export async function saveStep4Socials(formData: FormData) {
  try {
    await checkRateLimit()
    
    const data = {
      website: formData.get("website") as string,
      instagram: formData.get("instagram") as string,
      facebook: formData.get("facebook") as string,
      x: formData.get("x") as string,
      tiktok: formData.get("tiktok") as string,
      youtube: formData.get("youtube") as string,
    }

    const validated = Step4SocialsSchema.parse(data)
    const artist = await getArtist()

    const updatedArtist = await prisma.artist.update({
      where: { id: artist.id },
      data: {
        socials: {
          website: normalizeUrl(validated.website) || null,
          instagram: validated.instagram || null,
          facebook: validated.facebook || null,
          x: validated.x || null,
          tiktok: validated.tiktok || null,
          youtube: validated.youtube || null,
        },
        onboardingStep: 5,
        completionScore: computeArtistCompletionScore({
          ...artist,
          ...validated,
          website: normalizeUrl(validated.website),
        })
      }
    })

    revalidatePath("/studio/onboarding")
    redirect("/studio/onboarding/5-kyc")
  } catch (error) {
    throw error instanceof Error ? error : new Error("Failed to save social media information")
  }
}

export async function submitKyc(formData: FormData) {
  try {
    await checkRateLimit()
    
    const data = {
      country: formData.get("country") as string,
      documentType: formData.get("documentType") as string,
      docLast4: formData.get("docLast4") as string,
      frontImageUrl: formData.get("frontImageUrl") as string,
      backImageUrl: formData.get("backImageUrl") as string,
      selfieImageUrl: formData.get("selfieImageUrl") as string,
    }

    const validated = KycStepSchema.parse(data)
    const artist = await getArtist()

    // Upsert KYC verification
    await prisma.kycVerification.upsert({
      where: { artistId: artist.id },
      update: {
        country: validated.country,
        documentType: validated.documentType as any,
        docLast4: validated.docLast4 || null,
        frontImageUrl: normalizeUrl(validated.frontImageUrl) || null,
        backImageUrl: normalizeUrl(validated.backImageUrl) || null,
        selfieImageUrl: normalizeUrl(validated.selfieImageUrl) || null,
        status: "PENDING",
        updatedAt: new Date(),
      },
      create: {
        artistId: artist.id,
        country: validated.country,
        documentType: validated.documentType as any,
        docLast4: validated.docLast4 || null,
        frontImageUrl: normalizeUrl(validated.frontImageUrl) || null,
        backImageUrl: normalizeUrl(validated.backImageUrl) || null,
        selfieImageUrl: normalizeUrl(validated.selfieImageUrl) || null,
        status: "PENDING",
        provider: "MANUAL",
      }
    })

    // Update artist KYC status and completion
    const updatedArtist = await prisma.artist.update({
      where: { id: artist.id },
      data: {
        kycStatus: "PENDING",
        onboardingStep: 6,
        completionScore: computeArtistCompletionScore({
          ...artist,
          kycStatus: "PENDING",
        })
      }
    })

    revalidatePath("/studio/onboarding")
    redirect("/studio/onboarding/6-review")
  } catch (error) {
    throw error instanceof Error ? error : new Error("Failed to submit KYC information")
  }
}
