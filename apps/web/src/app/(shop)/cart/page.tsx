import { Metadata } from "next";
import { cookies } from "next/headers";
import { auth } from "@/auth/client";
import { getOrCreateCart } from "@artfromromania/db";
import { formatMinor } from "@artfromromania/shared";
import { CartItems } from "./CartItems";
import { CartSummary } from "./CartSummary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Shopping Cart | RomArt",
  description: "Review your cart and proceed to checkout",
};

export default async function CartPage() {
  const session = await auth();
  const cookieStore = await cookies();
  
  // Get cart
  const anonymousId = cookieStore.get("romart_anid")?.value;
  const cart = await getOrCreateCart({
    userId: session?.user?.id,
    anonymousId: session?.user?.id ? undefined : anonymousId,
    currency: "EUR"
  });

  if (cart.items.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Your Cart</h1>
          <p className="text-muted-foreground">Your cart is empty</p>
          <Button asChild>
            <Link href="/discover">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Calculate totals
  const subtotal = cart.items.reduce((sum: number, item: any) => sum + (item.unitAmount * item.quantity), 0);
  const hasDigitalOnly = cart.items.every((item: any) => item.kind === "DIGITAL");
  const shipping = hasDigitalOnly ? 0 : parseInt(process.env.FLAT_SHIPPING_EUR || "1500", 10);
  const total = subtotal + shipping;

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Your Cart</h1>
        <p className="text-muted-foreground mt-2">
          {cart.items.length} item{cart.items.length !== 1 ? 's' : ''} in your cart
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <CartItems items={cart.items} />
        </div>

        {/* Cart Summary */}
        <div className="space-y-6">
          <CartSummary 
            subtotal={subtotal}
            shipping={shipping}
            total={total}
            hasDigitalOnly={hasDigitalOnly}
          />
          
          <Button asChild className="w-full" size="lg">
            <Link href="/checkout">Proceed to Checkout</Link>
          </Button>
          
          <Button variant="outline" asChild className="w-full">
            <Link href="/discover">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
