import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth/client";

interface RouteParams {
  params: Promise<{
    orderId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { orderId } = await params;
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Call API to get invoice download URL
    const apiUrl = process.env.API_URL || "http://localhost:4000";
    const response = await fetch(`${apiUrl}/invoices/${orderId}/download`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${process.env.API_SECRET_KEY || "dev-secret"}`,
        "x-user-id": session.user.id
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || "Failed to get invoice download URL" },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Invoice download error:", error);
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
