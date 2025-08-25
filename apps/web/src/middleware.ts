import { auth } from "@/auth/config"
import { prisma } from "@artfromromania/db"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import createIntlMiddleware from 'next-intl/middleware';

// Create the intl middleware
const intlMiddleware = createIntlMiddleware({
  locales: ['en', 'ro'],
  defaultLocale: 'en',
  localePrefix: 'always'
});

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

  // Handle i18n routing first
  const intlResponse = intlMiddleware(request);
  if (intlResponse) {
    return intlResponse;
  }

  // Extract locale from pathname
  const pathnameHasLocale = /^\/(?:en|ro)(?:\/|$)/.test(pathname);
  const locale = pathnameHasLocale ? pathname.split('/')[1] : 'en';
  const pathnameWithoutLocale = pathnameHasLocale ? pathname.replace(`/${locale}`, '') : pathname;

  // Skip authentication for API routes and public routes
  if (pathnameWithoutLocale.startsWith("/api/")) {
    return NextResponse.next();
  }

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
    "/discover",
    "/artist",
    "/artwork",
  ];

  // Check if the current path is public
  const isPublicRoute = publicRoutes.some(route => 
    pathnameWithoutLocale === route || pathnameWithoutLocale.startsWith(route + "/")
  );

  // Allow public routes
  if (isPublicRoute) {
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

  // Check authentication for protected routes
  const session = await auth();

  // Require authentication for all other routes
  if (!session?.user) {
    const signInUrl = new URL(`/${locale}/sign-in`, request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Handle studio access for ARTIST/ADMIN users
  if (pathnameWithoutLocale.startsWith("/studio")) {
    // Allow onboarding routes
    if (pathnameWithoutLocale.startsWith("/studio/onboarding")) {
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
            return NextResponse.redirect(new URL(`/${locale}/studio/onboarding`, request.url));
          }
        } else {
          // No artist profile found, redirect to onboarding
          return NextResponse.redirect(new URL(`/${locale}/studio/onboarding`, request.url));
        }
      } catch (error) {
        console.error("Error checking artist status:", error);
        // On error, redirect to onboarding to be safe
        return NextResponse.redirect(new URL(`/${locale}/studio/onboarding`, request.url));
      }
    } else {
      // Non-ARTIST users trying to access studio
      const dashboardUrl = new URL(`/${locale}/dashboard`, request.url);
      dashboardUrl.searchParams.set("upgrade", "artist");
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // Handle dashboard access
  if (pathnameWithoutLocale === "/dashboard") {
    // All authenticated users can access dashboard
    return NextResponse.next();
  }

  // Handle account routes
  if (pathnameWithoutLocale.startsWith("/account")) {
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
