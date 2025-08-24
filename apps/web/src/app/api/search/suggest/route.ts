import { NextRequest, NextResponse } from "next/server";
import { searchSuggestions } from "@/lib/search";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ artworks: [], artists: [] });
    }

    const suggestions = await searchSuggestions(query.trim(), 5);
    
    const response = NextResponse.json(suggestions);
    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=600");
    response.headers.set("Vary", "Accept-Language");
    
    return response;
  } catch (error) {
    console.error("Search suggestions error:", error);
    return NextResponse.json(
      { error: "Failed to get suggestions" },
      { status: 500 }
    );
  }
}
