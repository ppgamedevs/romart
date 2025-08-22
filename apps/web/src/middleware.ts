import { auth } from "@/auth/config"
import { prisma } from "@artfromromania/db"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const session = await auth()
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/sign-in",
    "/sign-up",
    "/styleguide",
    "/api/health",
    "/api/auth",
  ]

  // Check if the current path is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + "/")
  )

  // Allow public routes and API routes
  if (isPublicRoute || pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  // Artist profile pages are public
  if (pathname.startsWith("/artist/")) {
    return NextResponse.next()
  }

  // Require authentication for all other routes
  if (!session?.user) {
    const signInUrl = new URL("/sign-in", request.url)
    signInUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Handle studio access for ARTIST/ADMIN users
  if (pathname.startsWith("/studio")) {
    // Allow onboarding routes
    if (pathname.startsWith("/studio/onboarding")) {
      return NextResponse.next()
    }

    // For other studio routes, check completion and KYC status
    if (session.user.role === "ARTIST" || session.user.role === "ADMIN") {
      try {
        const artist = await prisma.artist.findUnique({
          where: { userId: session.user.id },
          select: {
            completionScore: true,
            kycStatus: true,
          }
        })

        if (artist) {
          // Redirect to onboarding if completion score < 80 or KYC is rejected
          if (artist.completionScore < 80 || artist.kycStatus === "REJECTED") {
            return NextResponse.redirect(new URL("/studio/onboarding", request.url))
          }
        } else {
          // No artist profile found, redirect to onboarding
          return NextResponse.redirect(new URL("/studio/onboarding", request.url))
        }
      } catch (error) {
        console.error("Error checking artist status:", error)
        // On error, redirect to onboarding to be safe
        return NextResponse.redirect(new URL("/studio/onboarding", request.url))
      }
    } else {
      // Non-ARTIST users trying to access studio
      const dashboardUrl = new URL("/dashboard", request.url)
      dashboardUrl.searchParams.set("upgrade", "artist")
      return NextResponse.redirect(dashboardUrl)
    }
  }

  // Handle dashboard access
  if (pathname === "/dashboard") {
    // All authenticated users can access dashboard
    return NextResponse.next()
  }

  // Handle account routes
  if (pathname.startsWith("/account")) {
    // All authenticated users can access account
    return NextResponse.next()
  }

  // Default: allow the request to proceed
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}
