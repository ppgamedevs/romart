import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ artworkId: string }> }
) {
  const { artworkId } = await params;
  try {
    // Call the API server
    const response = await fetch(`${process.env.API_BASE_URL}/artworks/${artworkId}/social-proof`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: "Failed to fetch social proof" },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    // Set cache headers
    const responseHeaders = new Headers();
    responseHeaders.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    
    return NextResponse.json(result, { headers: responseHeaders });
  } catch (error) {
    console.error("Social proof fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
