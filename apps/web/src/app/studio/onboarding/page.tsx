import { getAuthSession } from "@/auth/utils"
import { redirect } from "next/navigation"
import { prisma } from "@artfromromania/db"

export default async function OnboardingPage() {
  const session = await getAuthSession()
  
  if (!session?.user) {
    redirect("/sign-in")
  }

  if (session.user.role !== "ARTIST" && session.user.role !== "ADMIN") {
    redirect("/dashboard?upgrade=artist")
  }

  // Get artist profile
  const artist = await prisma.artist.findUnique({
    where: { userId: session.user.id },
    select: {
      onboardingStep: true,
      completionScore: true,
      kycStatus: true,
    }
  })

  if (!artist) {
    redirect("/dashboard?upgrade=artist")
  }

  // Check if artist can access studio (completion score >= 80 and KYC not rejected)
  if (artist.completionScore >= 80 && artist.kycStatus !== "REJECTED") {
    redirect("/studio")
  }

  // Redirect to the current step
  const currentStep = Math.max(1, Math.min(artist.onboardingStep, 6))
  redirect(`/studio/onboarding/${currentStep}-${getStepPath(currentStep)}`)
}

function getStepPath(step: number): string {
  switch (step) {
    case 1: return "basic"
    case 2: return "bio"
    case 3: return "experience"
    case 4: return "socials"
    case 5: return "kyc"
    case 6: return "review"
    default: return "basic"
  }
}
