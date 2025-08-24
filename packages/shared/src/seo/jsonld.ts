// Types for JSON-LD structured data
export interface Artwork {
  id: string;
  title: string;
  description?: string | null;
  year?: number | null;
  medium?: string | null;
  widthCm?: number | null;
  heightCm?: number | null;
  depthCm?: number | null;
  priceAmount: number;
  priceCurrency: string;
  kind: string;
  status: string;
  slug: string;
  artist: Artist;
  images: Array<{ url: string; alt?: string | null }>;
  editions: Array<Edition>;
}

export interface Artist {
  id: string;
  displayName: string;
  slug: string;
}

export interface Edition {
  id: string;
  type: string;
  unitAmount: number;
  currency: string;
}

export interface VisualArtworkJsonLdProps {
  artwork: Artwork & {
    artist: Artist;
    images: Array<{ url: string; alt?: string }>;
    editions?: Edition[];
  };
  primaryImageUrl: string;
  offer: {
    price: number;
    currency: string;
    availability: "InStock" | "OutOfStock";
  };
}

export function visualArtworkJsonLd({
  artwork,
  primaryImageUrl,
  offer
}: VisualArtworkJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    name: artwork.title,
    creator: {
      "@type": "Person",
      name: artwork.artist.displayName,
      url: `/artist/${artwork.artist.slug}`
    },
    image: primaryImageUrl,
    artMedium: artwork.medium,
    width: artwork.widthCm ? `${artwork.widthCm} cm` : undefined,
    height: artwork.heightCm ? `${artwork.heightCm} cm` : undefined,
    depth: artwork.depthCm ? `${artwork.depthCm} cm` : undefined,
    dateCreated: artwork.year ? `${artwork.year}` : undefined,
    url: `/artwork/${artwork.slug}`,
    offers: {
      "@type": "Offer",
      price: offer.price / 100, // Convert from minor units
      priceCurrency: offer.currency,
      availability: `https://schema.org/${offer.availability}`,
      seller: {
        "@type": "Person",
        name: artwork.artist.displayName
      }
    }
  };

  // Remove undefined values
  return JSON.parse(JSON.stringify(jsonLd));
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}${item.url}`
    }))
  };

  return jsonLd;
}
