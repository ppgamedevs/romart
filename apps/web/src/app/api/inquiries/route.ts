import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreateInquirySchema = z.object({
  type: z.enum(["QUESTION", "COMMISSION"]),
  artistId: z.string(),
  artworkId: z.string().optional(),
  email: z.string().email(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  dimensions: z.string().optional(),
  deadlineAt: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateInquirySchema.parse(body);

    // Call the API server
    const response = await fetch(`${process.env.API_BASE_URL}/inquiries`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": request.headers.get("x-forwarded-for") || "",
        "User-Agent": request.headers.get("user-agent") || "",
      },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: "Failed to create inquiry" },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Inquiry creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
