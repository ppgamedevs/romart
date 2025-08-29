"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ArtworkCardProps {
  id: string;
  slug: string;
  title: string;
  artistName: string;
  image: string;
  minPriceMinor?: number | null;
  priceMinor?: number | null;
  salePct?: number | null;
  locale: string;
}

export function ArtworkCard({
  id,
  slug,
  title,
  artistName,
  image,
  minPriceMinor,
  priceMinor,
  salePct,
  locale,
}: ArtworkCardProps) {
  const displayPrice = minPriceMinor ?? priceMinor;
  const hasSale = salePct && salePct > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="group relative"
    >
      <Link href={`/${locale}/artwork/${slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-100">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          
          {/* Sale Badge */}
          {hasSale && (
            <div className="absolute top-3 left-3 z-10">
              <Badge variant="sale">
                SALE -{salePct}%
              </Badge>
            </div>
          )}

          {/* Quick View Button */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 hover:bg-white text-fg"
              onClick={(e) => {
                e.preventDefault();
                // Quick view functionality would go here
                console.log("Quick view:", id);
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Quick View
            </Button>
          </div>
        </div>

        <div className="mt-3 space-y-1">
          <h3 className="font-medium text-fg line-clamp-1 group-hover:text-accent transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted">
            {artistName}
          </p>
          {displayPrice && (
            <p className="text-sm font-medium text-fg">
              {minPriceMinor ? `From ${(displayPrice / 100).toFixed(2)} €` : `${(displayPrice / 100).toFixed(2)} €`}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
