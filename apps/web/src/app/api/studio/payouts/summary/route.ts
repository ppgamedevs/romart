import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ARTIST") {
      return NextResponse.json(
        { error: "Forbidden: Artist access required" },
        { status: 403 }
      );
    }

    const apiUrl = process.env.API_URL || "http://localhost:4000";
    const response = await fetch(`${apiUrl}/payouts/summary`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${process.env.API_SECRET_KEY || "dev-secret"}`,
        "x-user-id": session.user.id
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || "Failed to fetch payout summary" },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Payouts summary error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
