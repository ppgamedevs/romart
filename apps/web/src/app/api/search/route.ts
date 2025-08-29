import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const api = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const response = await fetch(`${api}/public/search?${searchParams.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch search results" }, { status: response.status });
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching search results:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
