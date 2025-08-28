import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Payment Cancelled | RomArt",
  description: "Your payment was cancelled",
};

export default async function CheckoutCancelPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Payment Cancelled</h1>
          <p className="text-muted-foreground">
            Your payment was cancelled. No charges were made to your account.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>What happened?</CardTitle>
          </CardHeader>
          <CardContent className="text-left">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Your payment was cancelled before completion</li>
              <li>• No charges were made to your account</li>
              <li>• Your cart items are still available</li>
              <li>• You can try again anytime</li>
            </ul>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/cart">Return to Cart</Link>
          </Button>
          
          <Button variant="outline" asChild className="w-full">
            <Link href="/discover">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
