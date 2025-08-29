import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = (process.env.LOCALES || "en,ro").split(",");
const defaultLocale = process.env.DEFAULT_LOCALE || "en";

// Ignore API, static, og, etc.
function isPublic(path: string) {
  return path.startsWith("/api") ||
         path.startsWith("/_next") ||
         path.startsWith("/assets") ||
         path.startsWith("/favicon") ||
         path.startsWith("/robots") ||
         path.startsWith("/sitemap") ||
         path.startsWith("/manifest") ||
         path.includes("/opengraph-image");
}

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Handle root path redirect
  if (pathname === "/") {
    return NextResponse.redirect(new URL(`/${defaultLocale}`, req.url));
  }

  // Skip middleware for public paths
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Check if the pathname has a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return NextResponse.next();

  // Redirect to default locale if no locale is present
  const locale = defaultLocale;
  req.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(req.nextUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (web app manifest)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json).*)',
  ],
};
