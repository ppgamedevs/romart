import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const vatValidationSchema = z.object({
  country: z.string().length(2).toUpperCase(),
  vatId: z.string().min(1)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { country, vatId } = vatValidationSchema.parse(body);
    
    // Call API to validate VAT
    const apiUrl = process.env.API_URL || "http://localhost:4000";
    const response = await fetch(`${apiUrl}/tax/validate-vat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.API_SECRET_KEY || "dev-secret"}`
      },
      body: JSON.stringify({ country, vatId })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || "Failed to validate VAT ID" },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("VAT validation error:", error);
    
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
