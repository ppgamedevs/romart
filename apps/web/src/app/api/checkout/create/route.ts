import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/auth/client";
import { getOrCreateCart } from "@artfromromania/db";
import { z } from "zod";

const checkoutSchema = z.object({
  cartId: z.string(),
  email: z.string().email(),
  shippingAddress: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    region: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string(),
    isBusiness: z.boolean().default(false),
    vatId: z.string().optional()
  }),
  billingAddress: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    region: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string(),
    isBusiness: z.boolean().default(false),
    vatId: z.string().optional()
  })
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const cookieStore = await cookies();
    
    // Validate request body
    const body = await request.json();
    const validatedData = checkoutSchema.parse(body);
    
    // Get cart
    const anonymousId = cookieStore.get("romart_anid")?.value;
    const cart = await getOrCreateCart({
      userId: session?.user?.id,
      anonymousId: session?.user?.id ? undefined : anonymousId,
      currency: "EUR"
    });

    if (cart.id !== validatedData.cartId) {
      return NextResponse.json(
        { error: "Invalid cart" },
        { status: 400 }
      );
    }

    if (cart.items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }

    // Call API to create payment intent
    const apiUrl = process.env.API_URL || "http://localhost:4000";
    const response = await fetch(`${apiUrl}/payments/create-intent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.API_SECRET_KEY || "dev-secret"}`
      },
      body: JSON.stringify({
        cartId: cart.id,
        email: validatedData.email,
        shippingAddress: validatedData.shippingAddress,
        billingAddress: validatedData.billingAddress
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || "Failed to create payment intent" },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    return NextResponse.json({
      clientSecret: result.clientSecret,
      orderId: result.orderId,
      taxBreakdown: result.taxBreakdown
    });
  } catch (error) {
    console.error("Checkout error:", error);
    
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
