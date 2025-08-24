import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ARTIST" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const resolvedParams = await params;
    const apiUrl = `${process.env.API_URL || "http://localhost:4000"}/fulfillment/${resolvedParams.id}/qc-pass`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${session.user.id}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error marking QC passed:", error);
    return NextResponse.json(
      { error: "Failed to mark QC passed" },
      { status: 500 }
    );
  }
}
