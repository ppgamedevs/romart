import { Metadata } from "next";
import { cookies } from "next/headers";
import { auth } from "@/auth/client";
import { getOrCreateCart } from "@artfromromania/db";
import { redirect } from "next/navigation";
import StripeProvider from "./StripeProvider";
import CheckoutForm from "./CheckoutForm";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Checkout | RomArt",
  description: "Complete your purchase",
};

export default async function CheckoutPage() {
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
    redirect("/cart");
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        
        <StripeProvider>
          <CheckoutForm 
            cart={cart} 
            userEmail={session?.user?.email}
          />
        </StripeProvider>
      </div>
    </div>
  );
}
