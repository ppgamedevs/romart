import type { SearchArtworkDoc } from "./types";

// Type for artwork with joins from Prisma
interface ArtworkWithJoins {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  kind: "ORIGINAL" | "EDITIONED" | "DIGITAL";
  category: "Painting" | "Drawing" | "Photography" | "Digital" | null;
  priceAmount?: number | null;
  priceCurrency: string;
  framed: boolean;
  year?: number | null;
  publishedAt: Date | null;
  // Moderation fields
  moderationStatus: "PENDING" | "APPROVED" | "REJECTED" | "MATURE";
  contentRating: "SAFE" | "MATURE" | "PROHIBITED";
  suppressed: boolean;
  flaggedCount: number;
  artist: {
    id: string;
    displayName: string;
    slug: string;
    shadowbanned: boolean;
  };
  images: Array<{
    url: string;
    position: number;
  }>;
  editions: Array<{
    type: string;
    unitAmount: number;
    currency: string;
  }>;
}

export function toSearchDoc(artwork: ArtworkWithJoins): SearchArtworkDoc | null {
  // Calculate price based on kind
  let price = 0;
  let currency = "EUR";

  if (artwork.kind === "ORIGINAL") {
    price = artwork.priceAmount || 0;
    currency = artwork.priceCurrency;
  } else {
    // For EDITIONED/DIGITAL, use minimum edition price
    const minEdition = artwork.editions
      .filter(ed => ed.type === "PRINT" || ed.type === "DIGITAL")
      .sort((a, b) => a.unitAmount - b.unitAmount)[0];
    
    if (minEdition) {
      price = minEdition.unitAmount;
      currency = minEdition.currency;
    }
  }

  // Get primary image (position 0 or first image)
  const primaryImage = artwork.images
    .sort((a, b) => a.position - b.position)[0];

  // Calculate popularity based on moderation status and artist shadowban
  let popularity = 0;
  
  // Don't index rejected or suppressed content
  if (artwork.moderationStatus === "REJECTED" || artwork.suppressed) {
    return null; // Return null to skip indexing
  }
  
  // Reduce popularity for shadowbanned artists
  if (artwork.artist.shadowbanned) {
    popularity = -1000; // Very low popularity
  } else if (artwork.moderationStatus === "PENDING") {
    popularity = -100; // Lower popularity for pending items
  } else if (artwork.contentRating === "MATURE") {
    popularity = -50; // Slightly lower for mature content
  }

  return {
    id: artwork.id,
    slug: artwork.slug,
    title: artwork.title,
    description: artwork.description || undefined,
    kind: artwork.kind,
    category: artwork.category || "Painting", // Default to Painting if null
    artistId: artwork.artist.id,
    artistName: artwork.artist.displayName,
    artistSlug: artwork.artist.slug,
    price,
    currency,
    framed: artwork.framed,
    year: artwork.year || undefined,
    image: primaryImage?.url,
    publishedAt: artwork.publishedAt ? artwork.publishedAt.getTime() : 0,
    popularity,
    // Moderation fields
    moderationStatus: artwork.moderationStatus,
    contentRating: artwork.contentRating,
    flaggedCount: artwork.flaggedCount,
  };
}
