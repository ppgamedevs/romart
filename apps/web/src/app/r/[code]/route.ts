import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const searchParams = request.nextUrl.searchParams;
    
    // Build UTM parameters
    const utmParams = new URLSearchParams();
    if (searchParams.get('utm_source')) utmParams.set('utm_source', searchParams.get('utm_source')!);
    if (searchParams.get('utm_medium')) utmParams.set('utm_medium', searchParams.get('utm_medium')!);
    if (searchParams.get('utm_campaign')) utmParams.set('utm_campaign', searchParams.get('utm_campaign')!);
    if (searchParams.get('utm_content')) utmParams.set('utm_content', searchParams.get('utm_content')!);
    if (searchParams.get('utm_term')) utmParams.set('utm_term', searchParams.get('utm_term')!);

    // Call API to resolve the referral code
    const apiUrl = process.env.API_URL || 'http://localhost:3001';
    const resolveUrl = new URL('/aff/resolve', apiUrl);
    resolveUrl.searchParams.set('code', code);
    utmParams.forEach((value, key) => resolveUrl.searchParams.set(key, value));

    const response = await fetch(resolveUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Forward consent headers
        'x-cmp-analytics': request.headers.get('x-cmp-analytics') || 'false',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      // If referral code not found, redirect to home
      return NextResponse.redirect(new URL('/', request.url));
    }

    const data = await response.json();
    
    // Create redirect response
    const redirectUrl = new URL(data.landing, process.env.NEXT_PUBLIC_SITE_URL || request.url);
    const redirect = NextResponse.redirect(redirectUrl);

    // Set affiliate cookie if user has consented
    if (data.setCookie) {
      redirect.cookies.set(data.setCookie.name, data.setCookie.value, {
        maxAge: data.setCookie.days * 86400, // Convert days to seconds
        path: '/',
        httpOnly: false, // Allow JavaScript access for analytics
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    }

    return redirect;
  } catch (error) {
    console.error('Error processing referral redirect:', error);
    // Fallback to home page
    return NextResponse.redirect(new URL('/', request.url));
  }
}

// Prevent indexing of referral pages
export const dynamic = 'force-dynamic';
