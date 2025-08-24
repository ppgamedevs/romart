import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth/client";
import { z } from "zod";

const createLinkSchema = z.object({
  entitlementId: z.string()
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { entitlementId } = createLinkSchema.parse(body);

    // Call API to create download link
    const apiUrl = process.env.API_URL || "http://localhost:4000";
    const response = await fetch(`${apiUrl}/downloads/link`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.API_SECRET_KEY || "dev-secret"}`,
        "x-user-id": session.user.id
      },
      body: JSON.stringify({ entitlementId })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || "Failed to create download link" },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    // Return the download URL - it will be a relative URL to the API
    return NextResponse.json({
      downloadUrl: `${apiUrl}${result.downloadUrl}`,
      expiresAt: result.expiresAt,
      filename: result.filename
    });
  } catch (error) {
    console.error("Download link creation error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
