import { getAuthSession } from "@/auth/utils"
import { redirect } from "next/navigation"
import { prisma } from "@artfromromania/db"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, User, FileText, Award, Share2, Shield, CheckCircle } from "lucide-react"
import Link from "next/link"

const steps = [
  { id: 1, title: "Basic Info", icon: User, path: "/studio/onboarding/1-basic" },
  { id: 2, title: "Bio & Statement", icon: FileText, path: "/studio/onboarding/2-bio" },
  { id: 3, title: "Experience", icon: Award, path: "/studio/onboarding/3-experience" },
  { id: 4, title: "Social Media", icon: Share2, path: "/studio/onboarding/4-socials" },
  { id: 5, title: "KYC Verification", icon: Shield, path: "/studio/onboarding/5-kyc" },
  { id: 6, title: "Review", icon: CheckCircle, path: "/studio/onboarding/6-review" },
]

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
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

  const currentStep = artist.onboardingStep
  const progress = (currentStep / steps.length) * 100

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard" 
                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Link>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Profile Completion</div>
              <div className="text-2xl font-bold">{artist.completionScore}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Complete Your Artist Profile</h1>
              <div className="text-sm text-muted-foreground">
                Step {currentStep} of {steps.length}
              </div>
            </div>
            <Progress value={progress} className="h-2" />
            
            {/* Step Indicators */}
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isCompleted = step.id < currentStep
                const isCurrent = step.id === currentStep
                const isUpcoming = step.id > currentStep
                
                return (
                  <div key={step.id} className="flex flex-col items-center space-y-2">
                    <div className={`
                      flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                      ${isCompleted 
                        ? "bg-primary border-primary text-primary-foreground" 
                        : isCurrent 
                        ? "border-primary text-primary" 
                        : "border-muted text-muted-foreground"
                      }
                    `}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className={`
                      text-xs text-center max-w-20
                      ${isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"}
                    `}>
                      {step.title}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
