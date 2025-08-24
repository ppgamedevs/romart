"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Download } from "lucide-react";
import { addToCart } from "@/app/(shop)/cart/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PurchaseButtonsProps {
  artwork: {
    id: string;
    kind: "ORIGINAL" | "EDITIONED" | "DIGITAL";
    priceAmount?: number | null;
  };
  editions: Array<{
    id: string;
    type: "PRINT" | "DIGITAL";
    unitAmount: number;
    available?: number | null;
  }>;
}

export function PurchaseButtons({ artwork, editions }: PurchaseButtonsProps) {
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const router = useRouter();

  const handleAddToCart = async (kind: "ORIGINAL" | "EDITIONED" | "DIGITAL", artworkId?: string, editionId?: string) => {
    const itemId = `${kind}-${artworkId || editionId}`;
    setIsAdding(itemId);
    
    try {
      const result = await addToCart({
        kind,
        artworkId,
        editionId,
        quantity: 1
      });

      if (result.success) {
        toast.success("Added to cart!");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to add to cart");
      }
    } catch (error) {
      toast.error("Failed to add to cart");
    } finally {
      setIsAdding(null);
    }
  };

  const handleViewCart = () => {
    router.push("/cart");
  };

  return (
    <div className="space-y-4">
      {/* Original Artwork Purchase */}
      {artwork.kind === "ORIGINAL" && artwork.priceAmount && (
        <div className="space-y-2">
          <Button 
            onClick={() => handleAddToCart("ORIGINAL", artwork.id)}
            disabled={isAdding === `ORIGINAL-${artwork.id}`}
            className="w-full"
            size="lg"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {isAdding === `ORIGINAL-${artwork.id}` ? "Adding..." : "Purchase Original"}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleViewCart}
            className="w-full"
          >
            View Cart
          </Button>
        </div>
      )}

      {/* Editions */}
      {editions.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium">Available Editions</h3>
          {editions.map((edition) => {
            const isAvailable = edition.available === null || edition.available === undefined || edition.available > 0;
            const kind = edition.type === "PRINT" ? "EDITIONED" : "DIGITAL";
            
            return (
              <div key={edition.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">
                    {edition.type === "PRINT" ? "Print Edition" : "Digital Edition"}
                  </p>
                  {edition.available !== null && (
                    <p className="text-sm text-muted-foreground">
                      Available: {edition.available}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    €{(edition.unitAmount / 100).toFixed(2)}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleAddToCart(kind, undefined, edition.id)}
                    disabled={!isAvailable || isAdding === `${kind}-${edition.id}`}
                  >
                    {isAdding === `${kind}-${edition.id}` ? (
                      "Adding..."
                    ) : edition.type === "DIGITAL" ? (
                      <Download className="h-4 w-4" />
                    ) : (
                      <ShoppingCart className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
