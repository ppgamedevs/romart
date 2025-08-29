"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface BuyBoxProps {
  artwork: {
    id: string;
    title: string;
    artistName: string;
    priceMinor?: number | null;
    salePct?: number | null;
    currency?: string;
  };
  locale: string;
}

interface Quote {
  unit: {
    netMinor: number;
  };
  currency: string;
  deliveryEstimate?: string;
}

export function BuyBox({ artwork, locale }: BuyBoxProps) {
  const [selectedFormat, setSelectedFormat] = useState("ORIGINAL");
  const [selectedSize, setSelectedSize] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const formats = [
    { value: "ORIGINAL", label: "Original" },
    { value: "CANVAS", label: "Canvas Print" },
    { value: "METAL", label: "Metal Print" },
    { value: "PHOTO", label: "Photo Print" },
  ];

  const sizes = [
    { value: "small", label: "Small (30x40cm)" },
    { value: "medium", label: "Medium (50x70cm)" },
    { value: "large", label: "Large (70x100cm)" },
  ];

  useEffect(() => {
    if (selectedFormat && selectedSize) {
      fetchQuote();
    }
  }, [selectedFormat, selectedSize]);

  const fetchQuote = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/public/price/quote?artworkId=${artwork.id}&format=${selectedFormat}&size=${selectedSize}`);
      if (response.ok) {
        const data = await response.json();
        setQuote(data);
      }
    } catch (error) {
      console.error("Failed to fetch quote:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const displayPrice = quote?.unit?.netMinor ?? artwork.priceMinor;
  const hasSale = artwork.salePct && artwork.salePct > 0;

  return (
    <div className="sticky top-20 space-y-6">
      {/* Title and Artist */}
      <div>
        <h1 className="text-2xl font-bold text-fg mb-2">{artwork.title}</h1>
        <p className="text-lg text-muted">by {artwork.artistName}</p>
        {hasSale && (
          <Badge variant="sale" className="mt-2">
            SALE -{artwork.salePct}%
          </Badge>
        )}
      </div>

      {/* Format Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-fg">Format</label>
        <Select
          value={selectedFormat}
          onChange={(e) => setSelectedFormat(e.target.value)}
        >
          {formats.map((format) => (
            <option key={format.value} value={format.value}>
              {format.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Size Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-fg">Size</label>
        <Select
          value={selectedSize}
          onChange={(e) => setSelectedSize(e.target.value)}
        >
          <option value="">Select size</option>
          {sizes.map((size) => (
            <option key={size.value} value={size.value}>
              {size.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Price Display */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-fg">Price</label>
        <div className="text-2xl font-bold text-fg">
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : displayPrice ? (
            `${(displayPrice / 100).toFixed(2)} ${quote?.currency || artwork.currency || "EUR"}`
          ) : (
            "Price on request"
          )}
        </div>
        {quote?.deliveryEstimate && (
          <p className="text-sm text-muted">
            Delivery: {quote.deliveryEstimate}
          </p>
        )}
      </div>

      {/* CTA Buttons */}
      <div className="space-y-3">
        <Button size="lg" className="w-full" disabled={!displayPrice}>
          {locale === "ro" ? "Adaugă în coș" : "Add to Cart"}
        </Button>
        
        <Button variant="outline" size="lg" className="w-full">
          {locale === "ro" ? "Întreabă un Curator" : "Ask a Curator"}
        </Button>
      </div>

      {/* Delivery Info */}
      <div className="pt-4 border-t border-border">
        <div className="space-y-2 text-sm text-muted">
          <p>• Free shipping on orders over 500€</p>
          <p>• 30-day return policy</p>
          <p>• Certificate of authenticity included</p>
        </div>
      </div>
    </div>
  );
}
