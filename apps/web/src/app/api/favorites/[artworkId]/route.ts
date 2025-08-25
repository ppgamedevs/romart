import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ artworkId: string }> }
) {
  const { artworkId } = await params;
  try {
    // Call the API server
    const response = await fetch(`${process.env.API_BASE_URL}/favorites/${artworkId}`, {
      method: "DELETE",
      headers: {
        "Authorization": request.headers.get("authorization") || "",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: "Failed to delete favorite" },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Favorite deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
