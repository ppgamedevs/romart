"use client";

import { useState } from "react";
import Image from "next/image";
import { formatMinor } from "@artfromromania/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trash2, Minus, Plus } from "lucide-react";
import { updateCartItemQuantity, removeCartItem } from "./actions";
import { toast } from "sonner";
import Link from "next/link";

interface CartItemsProps {
  items: Array<{
    id: string;
    kind: "ORIGINAL" | "EDITIONED" | "DIGITAL";
    quantity: number;
    unitAmount: number;
    currency: string;
    artwork?: {
      id: string;
      slug: string;
      title: string;
      heroImageUrl?: string | null;
      artist: {
        displayName: string;
        slug: string;
      };
    } | null;
    edition?: {
      id: string;
      type: "PRINT" | "DIGITAL";
      sizeName?: string | null;
      material?: string | null;
      artwork: {
        id: string;
        slug: string;
        title: string;
        heroImageUrl?: string | null;
        artist: {
          displayName: string;
          slug: string;
        };
      };
    } | null;
  }>;
}

export function CartItems({ items }: CartItemsProps) {
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setUpdatingItems(prev => new Set(prev).add(itemId));
    
    try {
      const result = await updateCartItemQuantity(itemId, newQuantity);
      if (!result.success) {
        toast.error(result.error || "Failed to update quantity");
      }
    } catch (error) {
      toast.error("Failed to update quantity");
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setUpdatingItems(prev => new Set(prev).add(itemId));
    
    try {
      const result = await removeCartItem(itemId);
      if (!result.success) {
        toast.error(result.error || "Failed to remove item");
      } else {
        toast.success("Item removed from cart");
      }
    } catch (error) {
      toast.error("Failed to remove item");
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const artwork = item.artwork || item.edition?.artwork;
        const artist = artwork?.artist;
        const isUpdating = updatingItems.has(item.id);
        const isOriginal = item.kind === "ORIGINAL";
        
        return (
          <Card key={item.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex gap-4">
                {/* Image */}
                <div className="relative w-24 h-24 flex-shrink-0">
                  {artwork?.heroImageUrl ? (
                    <Image
                      src={artwork.heroImageUrl}
                      alt={artwork.title}
                      fill
                      className="object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted rounded-md flex items-center justify-center">
                      <span className="text-muted-foreground text-xs">No image</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <Link 
                        href={`/artwork/${artwork?.slug}`}
                        className="hover:underline"
                      >
                        <h3 className="font-medium truncate">{artwork?.title}</h3>
                      </Link>
                      
                      <Link 
                        href={`/artist/${artist?.slug}`}
                        className="text-sm text-muted-foreground hover:underline"
                      >
                        by {artist?.displayName}
                      </Link>
                      
                      <div className="text-sm text-muted-foreground mt-1">
                        {isOriginal ? (
                          "Original Artwork"
                        ) : (
                          <>
                            {item.edition?.type === "PRINT" ? "Print" : "Digital"}
                            {item.edition?.sizeName && ` • ${item.edition.sizeName}`}
                            {item.edition?.material && ` • ${item.edition.material}`}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-medium">
                        {formatMinor(item.unitAmount * item.quantity)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatMinor(item.unitAmount)} each
                      </div>
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={isUpdating || isOriginal || item.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (!isNaN(value) && value >= 1) {
                            handleQuantityChange(item.id, value);
                          }
                        }}
                        className="w-16 text-center"
                        disabled={isUpdating || isOriginal}
                      />
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={isUpdating || isOriginal}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={isUpdating}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
