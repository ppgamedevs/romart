"use client";

import { useState } from "react";
import { Image } from "@/components/ui/image";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ArtworkGalleryProps {
  images: Array<{
    id: string;
    url: string;
    alt?: string;
  }>;
  title: string;
}

export function ArtworkGallery({ images, title }: ArtworkGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-muted flex items-center justify-center rounded-lg">
        <span className="text-muted-foreground">No images available</span>
      </div>
    );
  }

  const selectedImage = images[selectedImageIndex];

  const goToPrevious = () => {
    setSelectedImageIndex((prev) => 
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setSelectedImageIndex((prev) => 
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      goToPrevious();
    } else if (e.key === "ArrowRight") {
      goToNext();
    }
  };

  return (
    <div className="space-y-4">
      {/* Hero Image */}
      <div className="relative aspect-square overflow-hidden rounded-lg">
        <Image
          src={selectedImage.url}
          alt={selectedImage.alt || `${title} - Image ${selectedImageIndex + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 opacity-80 hover:opacity-100"
              onClick={goToPrevious}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-80 hover:opacity-100"
              onClick={goToNext}
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedImageIndex(index)}
              onKeyDown={handleKeyDown}
              className={`relative flex-shrink-0 aspect-square w-20 overflow-hidden rounded-md border-2 transition-colors ${
                index === selectedImageIndex
                  ? "border-primary"
                  : "border-transparent hover:border-muted-foreground"
              }`}
              aria-label={`View image ${index + 1}`}
              aria-selected={index === selectedImageIndex}
            >
              <Image
                src={image.url}
                alt={image.alt || `${title} - Thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
