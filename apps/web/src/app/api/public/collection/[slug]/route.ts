import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const api = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const response = await fetch(`${api}/public/collection/${slug}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Collection not found" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching collection:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
