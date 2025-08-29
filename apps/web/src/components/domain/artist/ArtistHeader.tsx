"use client";

import Image from "next/image";
import { MapPin, Users, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ArtistHeaderProps {
  artist: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
    bio?: string | null;
    locationCity?: string | null;
    locationCountry?: string | null;
    followersCount?: number;
    salesCount?: number;
  };
  locale: string;
}

export function ArtistHeader({ artist, locale }: ArtistHeaderProps) {
  return (
    <div className="relative">
      {/* Cover Image (subtle background) */}
      <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent" />
      
      <div className="relative container py-12">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {artist.avatarUrl ? (
              <Image
                src={artist.avatarUrl}
                alt={artist.displayName}
                width={120}
                height={120}
                className="rounded-full object-cover border-4 border-white shadow-soft"
              />
            ) : (
              <div className="w-30 h-30 rounded-full bg-muted/20 border-4 border-white shadow-soft flex items-center justify-center">
                <span className="text-4xl font-bold text-muted">
                  {artist.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-fg mb-2">
                {artist.displayName}
              </h1>
              
              {/* Location */}
              {artist.locationCity && (
                <div className="flex items-center text-muted mb-3">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>
                    {artist.locationCity}
                    {artist.locationCountry && `, ${artist.locationCountry}`}
                  </span>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center space-x-6 text-sm text-muted mb-4">
                {artist.followersCount && (
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{artist.followersCount.toLocaleString()} followers</span>
                  </div>
                )}
                {artist.salesCount && (
                  <div className="flex items-center">
                    <ShoppingBag className="h-4 w-4 mr-1" />
                    <span>{artist.salesCount} sales</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            {artist.bio && (
              <p className="text-muted leading-relaxed max-w-2xl">
                {artist.bio}
              </p>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button size="lg">
                {locale === "ro" ? "Urmărește" : "Follow"}
              </Button>
              
              <Button variant="outline" size="lg">
                {locale === "ro" ? "Întreabă un Curator" : "Ask a Curator"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
