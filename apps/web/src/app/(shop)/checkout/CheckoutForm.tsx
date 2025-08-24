"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";

interface Cart {
  id: string;
  items: Array<{
    id: string;
    quantity: number;
    unitAmount: number;
    currency: string;
    artwork?: { title: string; images: Array<{ lgUrl: string }> };
    edition?: { title: string };
  }>;
}

interface CheckoutFormProps {
  cart: Cart;
  userEmail?: string;
}

interface Address {
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode?: string;
  country: string;
  isBusiness: boolean;
  vatId?: string;
}

interface VatValidationResult {
  valid: boolean;
  name?: string;
  address?: string;
  reverseCharge?: boolean;
}

interface TaxBreakdown {
  subtotalAmount: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  taxRate?: number;
  reverseCharge?: boolean;
}

const EU_COUNTRIES = [
  { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgium" },
  { code: "BG", name: "Bulgaria" },
  { code: "HR", name: "Croatia" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" },
  { code: "EE", name: "Estonia" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "GR", name: "Greece" },
  { code: "HU", name: "Hungary" },
  { code: "IE", name: "Ireland" },
  { code: "IT", name: "Italy" },
  { code: "LV", name: "Latvia" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MT", name: "Malta" },
  { code: "NL", name: "Netherlands" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "RO", name: "Romania" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "ES", name: "Spain" },
  { code: "SE", name: "Sweden" }
];

export default function CheckoutForm({ cart, userEmail }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [email, setEmail] = useState(userEmail || "");
  const [loading, setLoading] = useState(false);
  const [vatValidating, setVatValidating] = useState(false);
  const [vatValidation, setVatValidation] = useState<VatValidationResult | null>(null);
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [taxBreakdown, setTaxBreakdown] = useState<TaxBreakdown | null>(null);
  
  const [billingAddress, setBillingAddress] = useState<Address>({
    line1: "",
    line2: "",
    city: "",
    region: "",
    postalCode: "",
    country: "RO",
    isBusiness: false,
    vatId: ""
  });
  
  const [shippingAddress, setShippingAddress] = useState<Address>({
    line1: "",
    line2: "",
    city: "",
    region: "",
    postalCode: "",
    country: "RO",
    isBusiness: false,
    vatId: ""
  });

  const validateVat = async (country: string, vatId: string) => {
    if (!vatId.trim()) {
      setVatValidation(null);
      return;
    }

    setVatValidating(true);
    try {
      const response = await fetch("/api/tax/validate-vat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, vatId })
      });

      if (response.ok) {
        const result = await response.json();
        setVatValidation(result);
      } else {
        setVatValidation({ valid: false });
      }
    } catch (error) {
      console.error("VAT validation error:", error);
      setVatValidation({ valid: false });
    } finally {
      setVatValidating(false);
    }
  };

  const handleVatIdChange = (value: string) => {
    setBillingAddress(prev => ({ ...prev, vatId: value }));
    if (value && billingAddress.isBusiness) {
      const timer = setTimeout(() => {
        validateVat(billingAddress.country, value);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setVatValidation(null);
    }
  };

  const handleBusinessToggle = (checked: boolean | "indeterminate") => {
    const isChecked = checked === true;
    setBillingAddress(prev => ({ ...prev, isBusiness: isChecked }));
    if (!isChecked) {
      setBillingAddress(prev => ({ ...prev, vatId: "" }));
      setVatValidation(null);
    }
  };

  const calculateTotal = () => {
    return cart.items.reduce((sum, item) => sum + (item.unitAmount * item.quantity), 0);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    try {
      // Create payment intent
      const checkoutResponse = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId: cart.id,
          email,
          billingAddress,
          shippingAddress: sameAsBilling ? billingAddress : shippingAddress
        })
      });

      if (!checkoutResponse.ok) {
        const error = await checkoutResponse.json();
        throw new Error(error.error || "Failed to create payment intent");
      }

      const { clientSecret, orderId, taxBreakdown: breakdown } = await checkoutResponse.json();
      setTaxBreakdown(breakdown);

      // Confirm payment
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Card element not found");
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email,
            name: `${billingAddress.line1}`,
            address: {
              line1: billingAddress.line1,
              line2: billingAddress.line2 || undefined,
              city: billingAddress.city,
              state: billingAddress.region || undefined,
              postal_code: billingAddress.postalCode || undefined,
              country: billingAddress.country
            }
          }
        }
      });

      if (error) {
        console.error("Payment failed:", error);
        throw new Error(error.message || "Payment failed");
      }

      if (paymentIntent.status === "succeeded") {
        window.location.href = `/checkout/success?order_id=${orderId}`;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert(error instanceof Error ? error.message : "An error occurred during checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Billing Address */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="business"
              checked={billingAddress.isBusiness}
              onCheckedChange={handleBusinessToggle}
            />
            <Label htmlFor="business">I&apos;m buying as a business</Label>
          </div>

          {billingAddress.isBusiness && (
            <div>
              <Label htmlFor="vatId">VAT ID</Label>
              <div className="relative">
                <Input
                  id="vatId"
                  value={billingAddress.vatId}
                  onChange={(e) => handleVatIdChange(e.target.value)}
                  placeholder="e.g., RO123456789"
                />
                {vatValidating && (
                  <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />
                )}
              </div>
              {vatValidation && (
                <div className={`text-sm mt-1 ${vatValidation.valid ? "text-green-600" : "text-red-600"}`}>
                  {vatValidation.valid ? (
                    <div>
                      ✓ VAT ID is valid
                      {vatValidation.reverseCharge && (
                        <div className="text-blue-600">Reverse charge will apply (0% VAT)</div>
                      )}
                      {vatValidation.name && (
                        <div className="text-muted-foreground">{vatValidation.name}</div>
                      )}
                    </div>
                  ) : (
                    "⚠ VAT ID is invalid or could not be verified"
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="country">Country</Label>
              <Select
                value={billingAddress.country}
                onValueChange={(value) => setBillingAddress(prev => ({ ...prev, country: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EU_COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="line1">Address Line 1</Label>
            <Input
              id="line1"
              value={billingAddress.line1}
              onChange={(e) => setBillingAddress(prev => ({ ...prev, line1: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="line2">Address Line 2 (Optional)</Label>
            <Input
              id="line2"
              value={billingAddress.line2}
              onChange={(e) => setBillingAddress(prev => ({ ...prev, line2: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={billingAddress.city}
                onChange={(e) => setBillingAddress(prev => ({ ...prev, city: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input
                id="postalCode"
                value={billingAddress.postalCode}
                onChange={(e) => setBillingAddress(prev => ({ ...prev, postalCode: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Address */}
      <Card>
        <CardHeader>
          <CardTitle>Shipping Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sameAsBilling"
              checked={sameAsBilling}
              onCheckedChange={(checked) => setSameAsBilling(checked === true)}
            />
            <Label htmlFor="sameAsBilling">Same as billing address</Label>
          </div>

          {!sameAsBilling && (
            <>
              <div>
                <Label htmlFor="shippingCountry">Country</Label>
                <Select
                  value={shippingAddress.country}
                  onValueChange={(value) => setShippingAddress(prev => ({ ...prev, country: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EU_COUNTRIES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="shippingLine1">Address Line 1</Label>
                <Input
                  id="shippingLine1"
                  value={shippingAddress.line1}
                  onChange={(e) => setShippingAddress(prev => ({ ...prev, line1: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="shippingLine2">Address Line 2 (Optional)</Label>
                <Input
                  id="shippingLine2"
                  value={shippingAddress.line2}
                  onChange={(e) => setShippingAddress(prev => ({ ...prev, line2: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shippingCity">City</Label>
                  <Input
                    id="shippingCity"
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="shippingPostalCode">Postal Code</Label>
                  <Input
                    id="shippingPostalCode"
                    value={shippingAddress.postalCode}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 border rounded-md">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#424770",
                    "::placeholder": {
                      color: "#aab7c4",
                    },
                  },
                },
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {cart.items.map((item) => (
            <div key={item.id} className="flex justify-between">
              <span>
                {item.artwork?.title || item.edition?.title} × {item.quantity}
              </span>
              <span>€{((item.unitAmount * item.quantity) / 100).toFixed(2)}</span>
            </div>
          ))}
          
          {taxBreakdown ? (
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>€{(taxBreakdown.subtotalAmount / 100).toFixed(2)}</span>
              </div>
              {taxBreakdown.shippingAmount > 0 && (
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>€{(taxBreakdown.shippingAmount / 100).toFixed(2)}</span>
                </div>
              )}
              {taxBreakdown.taxAmount > 0 ? (
                <div className="flex justify-between">
                  <span>
                    VAT {taxBreakdown.taxRate ? `(${(taxBreakdown.taxRate * 100).toFixed(0)}%)` : ''}
                  </span>
                  <span>€{(taxBreakdown.taxAmount / 100).toFixed(2)}</span>
                </div>
              ) : taxBreakdown.reverseCharge ? (
                <div className="flex justify-between text-blue-600">
                  <span>VAT (Reverse Charge)</span>
                  <span>€0.00</span>
                </div>
              ) : null}
              <div className="flex justify-between font-semibold border-t pt-1">
                <span>Total</span>
                <span>€{(taxBreakdown.totalAmount / 100).toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <div className="border-t pt-2">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>€{(calculateTotal() / 100).toFixed(2)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Button type="submit" disabled={!stripe || loading} className="w-full">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Complete Purchase
      </Button>
    </form>
  );
}
