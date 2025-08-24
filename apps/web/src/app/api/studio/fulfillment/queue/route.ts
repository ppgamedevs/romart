import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ARTIST" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const apiUrl = new URL("/fulfillment/queue", process.env.API_URL || "http://localhost:4000");
    
    // Forward query parameters
    searchParams.forEach((value, key) => {
      apiUrl.searchParams.append(key, value);
    });

    const response = await fetch(apiUrl.toString(), {
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
    console.error("Error fetching fulfillment queue:", error);
    return NextResponse.json(
      { error: "Failed to fetch fulfillment queue" },
      { status: 500 }
    );
  }
}
