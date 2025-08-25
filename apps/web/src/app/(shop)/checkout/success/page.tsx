"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Download } from "lucide-react";
import Link from "next/link";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Thank you for your purchase!</h1>
          <p className="text-muted-foreground">
            Your order has been confirmed and payment processed successfully.
          </p>
        </div>

        {orderId && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Order ID</p>
                <p className="font-mono text-lg">{orderId}</p>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/invoices/${orderId}/download`);
                      if (response.ok) {
                        const { downloadUrl } = await response.json();
                        window.open(downloadUrl, '_blank');
                      } else {
                        alert('Invoice not yet available. Please try again in a few minutes.');
                      }
                    } catch (error) {
                      console.error('Error downloading invoice:', error);
                      alert('Error downloading invoice. Please try again later.');
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Invoice
                </Button>
                <p className="text-xs text-muted-foreground">
                  Invoice will be available shortly after payment confirmation
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/account/downloads">Go to My Downloads</Link>
          </Button>
          
          <Button variant="outline" asChild className="w-full">
            <Link href="/discover">Continue Shopping</Link>
          </Button>
          
          <Button variant="outline" asChild className="w-full">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-pulse space-y-8">
            <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
