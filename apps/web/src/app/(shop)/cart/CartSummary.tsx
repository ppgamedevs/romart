import { formatMinor } from "@artfromromania/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CartSummaryProps {
  subtotal: number;
  shipping: number;
  total: number;
  hasDigitalOnly: boolean;
}

export function CartSummary({ subtotal, shipping, total, hasDigitalOnly }: CartSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatMinor(subtotal)}</span>
          </div>
          
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>
              {hasDigitalOnly ? (
                <span className="text-green-600">Free</span>
              ) : (
                formatMinor(shipping)
              )}
            </span>
          </div>
          
          {hasDigitalOnly && (
            <div className="text-sm text-muted-foreground">
              Digital items ship instantly
            </div>
          )}
        </div>
        
        <div className="border-t pt-4">
          <div className="flex justify-between font-medium text-lg">
            <span>Total</span>
            <span>{formatMinor(total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
