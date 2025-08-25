"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, HeartOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocale } from "next-intl";

interface FavoriteButtonProps {
  artworkId: string;
  isFavorited: boolean;
  onToggle?: (isFavorited: boolean) => void;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function FavoriteButton({
  artworkId,
  isFavorited: initialIsFavorited,
  onToggle,
  variant = "outline",
  size = "default",
  className = "",
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const locale = useLocale();

  const handleToggle = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/favorites/${artworkId}`, {
        method: isFavorited ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to toggle favorite");
      }

      const newIsFavorited = !isFavorited;
      setIsFavorited(newIsFavorited);
      onToggle?.(newIsFavorited);

      toast({
        title: newIsFavorited 
          ? (locale === "ro" ? "Salvat în favorite" : "Saved to favorites")
          : (locale === "ro" ? "Eliminat din favorite" : "Removed from favorites"),
        description: newIsFavorited
          ? (locale === "ro" ? "Lucrarea a fost adăugată la favoritele tale" : "Artwork added to your favorites")
          : (locale === "ro" ? "Lucrarea a fost eliminată din favorite" : "Artwork removed from favorites"),
      });
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: locale === "ro" ? "Eroare" : "Error",
        description: locale === "ro" 
          ? "Nu s-a putut actualiza favoritul. Încearcă din nou."
          : "Could not update favorite. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      disabled={isLoading}
      className={`${className} ${isFavorited ? "text-red-500" : ""}`}
    >
      {isFavorited ? (
        <Heart className="h-4 w-4 fill-current" />
      ) : (
        <HeartOff className="h-4 w-4" />
      )}
    </Button>
  );
}
