"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { auth } from "@/auth/client";
import { 
  getOrCreateCart, 
  addItemToCart, 
  updateItemQuantity, 
  removeItem,
  consolidateCarts 
} from "@artfromromania/db";
import { z } from "zod";

const addToCartSchema = z.object({
  kind: z.enum(["ORIGINAL", "EDITIONED", "DIGITAL"]),
  artworkId: z.string().optional(),
  editionId: z.string().optional(),
  quantity: z.number().min(1).default(1)
});

export async function addToCart(data: z.infer<typeof addToCartSchema>) {
  try {
    const session = await auth();
    const cookieStore = await cookies();
    
    // Get or create anonymous ID
    let anonymousId = cookieStore.get("romart_anid")?.value;
    if (!anonymousId) {
      anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      cookieStore.set("romart_anid", anonymousId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30 // 30 days
      });
    }

    // Get or create cart
    const cart = await getOrCreateCart({
      userId: session?.user?.id,
      anonymousId: session?.user?.id ? undefined : anonymousId,
      currency: "EUR"
    });

    // Add item to cart
    await addItemToCart({
      cartId: cart.id,
      kind: data.kind,
      artworkId: data.artworkId,
      editionId: data.editionId,
      quantity: data.quantity
    });

    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    console.error("Add to cart error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to add item to cart" 
    };
  }
}

export async function updateCartItemQuantity(itemId: string, quantity: number) {
  try {
    await updateItemQuantity(itemId, quantity);
    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    console.error("Update quantity error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update quantity" 
    };
  }
}

export async function removeCartItem(itemId: string) {
  try {
    await removeItem(itemId);
    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    console.error("Remove item error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to remove item" 
    };
  }
}

export async function consolidateUserCart() {
  try {
    const session = await auth();
    const cookieStore = await cookies();
    
    if (!session?.user?.id) {
      return { success: false, error: "User not authenticated" };
    }

    const anonymousId = cookieStore.get("romart_anid")?.value;
    if (!anonymousId) {
      return { success: true }; // No anonymous cart to consolidate
    }

    await consolidateCarts(session.user.id, anonymousId);
    
    // Clear the anonymous ID cookie
    cookieStore.delete("romart_anid");
    
    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    console.error("Consolidate cart error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to consolidate cart" 
    };
  }
}
