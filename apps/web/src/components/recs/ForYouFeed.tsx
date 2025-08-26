"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { track } from "@/lib/analytics";

interface Artwork {
  id: string;
  slug: string;
  title: string;
  thumbUrl: string;
  priceMinor: number;
  medium: string;
  artistId: string;
}

interface ForYouFeedProps {
  title?: string;
  maxItems?: number;
}

export default function ForYouFeed({ title = "For You", maxItems = 12 }: ForYouFeedProps) {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchForYou() {
      try {
        const response = await fetch("/api/recommendations/for-you", {
          credentials: "include"
        });
        if (response.ok) {
          const data = await response.json();
          setArtworks((data.items || []).slice(0, maxItems));
        } else if (response.status === 401) {
          // User not logged in, show empty state
          setArtworks([]);
        }
      } catch (error) {
        console.error("Failed to fetch personalized recommendations:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchForYou();
  }, [maxItems]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">{title}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: Math.min(6, maxItems) }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-0">
                <Skeleton className="aspect-square w-full" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (artworks.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">{title}</h3>
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Sign in to see personalized recommendations based on your preferences.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {artworks.map((artwork) => (
          <Link
            key={artwork.id}
            href={`/artwork/${artwork.slug}`}
            onClick={() => track("view_artwork", { 
              artwork_id: artwork.id, 
              section: "for_you",
              source: "dashboard"
            })}
            className="group"
          >
            <Card className="overflow-hidden transition-transform group-hover:scale-105">
              <CardContent className="p-0">
                <div className="aspect-square relative overflow-hidden">
                  <Image
                    src={artwork.thumbUrl}
                    alt={artwork.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 16vw"
                  />
                </div>
                <div className="p-3 space-y-1">
                  <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary">
                    {artwork.title}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {(artwork.priceMinor / 100).toLocaleString("ro-RO", {
                      style: "currency",
                      currency: "EUR"
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
