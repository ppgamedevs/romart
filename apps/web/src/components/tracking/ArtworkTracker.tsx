"use client";
import { useEffect } from "react";
import { trackEvent } from "@/lib/track";

interface ArtworkTrackerProps {
  artworkId: string;
  artistId: string;
}

export function ArtworkTracker({ artworkId, artistId }: ArtworkTrackerProps) {
  useEffect(() => {
    trackEvent({ 
      type: "VIEW_ARTWORK", 
      artworkId, 
      artistId 
    });
  }, [artworkId, artistId]);

  return null; // This component doesn't render anything
}
