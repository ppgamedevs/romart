import { auth } from "@/auth/config"
import { prisma } from "@artfromromania/db"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and Next.js internal routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') // Skip files with extensions
  ) {
    return NextResponse.next();
  }

  const session = await auth();

  // Public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/sign-in",
    "/sign-up",
    "/styleguide",
    "/api/health",
    "/api/auth",
    "/manifest.json",
    "/favicon.ico",
    "/apple-touch-icon.png",
  ];

  // Check if the current path is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + "/")
  );

  // Allow public routes and API routes
  if (isPublicRoute || pathname.startsWith("/api/")) {
    const response = NextResponse.next();
    
    // Add cache headers for HTML pages
    if (request.headers.get("accept")?.includes("text/html")) {
      response.headers.set(
        "Cache-Control", 
        "public, s-maxage=60, stale-while-revalidate=300"
      );
      
      // Optional tag for Cloudflare cache-tags
      const tagHeader = process.env.EDGE_CACHE_TAG_HEADER;
      if (tagHeader) {
        response.headers.set(tagHeader, "html");
      }
    }
    
    return response;
  }

  // Artist profile pages are public
  if (pathname.startsWith("/artist/")) {
    const response = NextResponse.next();
    
    // Add cache headers for HTML pages
    if (request.headers.get("accept")?.includes("text/html")) {
      response.headers.set(
        "Cache-Control", 
        "public, s-maxage=60, stale-while-revalidate=300"
      );
      
      // Optional tag for Cloudflare cache-tags
      const tagHeader = process.env.EDGE_CACHE_TAG_HEADER;
      if (tagHeader) {
        response.headers.set(tagHeader, "html");
      }
    }
    
    return response;
  }

  // Require authentication for all other routes
  if (!session?.user) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Handle studio access for ARTIST/ADMIN users
  if (pathname.startsWith("/studio")) {
    // Allow onboarding routes
    if (pathname.startsWith("/studio/onboarding")) {
      return NextResponse.next();
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
        });

        if (artist) {
          // Redirect to onboarding if completion score < 80 or KYC is rejected
          if (artist.completionScore < 80 || artist.kycStatus === "REJECTED") {
            return NextResponse.redirect(new URL("/studio/onboarding", request.url));
          }
        } else {
          // No artist profile found, redirect to onboarding
          return NextResponse.redirect(new URL("/studio/onboarding", request.url));
        }
      } catch (error) {
        console.error("Error checking artist status:", error);
        // On error, redirect to onboarding to be safe
        return NextResponse.redirect(new URL("/studio/onboarding", request.url));
      }
    } else {
      // Non-ARTIST users trying to access studio
      const dashboardUrl = new URL("/dashboard", request.url);
      dashboardUrl.searchParams.set("upgrade", "artist");
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // Handle dashboard access
  if (pathname === "/dashboard") {
    // All authenticated users can access dashboard
    return NextResponse.next();
  }

  // Handle account routes
  if (pathname.startsWith("/account")) {
    // All authenticated users can access account
    return NextResponse.next();
  }

  // Default: allow the request to proceed
  return NextResponse.next();
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
    "/((?!_next/static|_next/image|favicon.ico|public|manifest.json|apple-touch-icon).*)",
  ],
};
