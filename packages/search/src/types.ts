export type SearchArtworkDoc = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  kind: "ORIGINAL" | "EDITIONED" | "DIGITAL";
  category: "Painting" | "Drawing" | "Photography" | "Digital";
  artistId: string;
  artistName: string;
  artistSlug: string;
  price: number;          // minor units (min edition price for EDITIONED/DIGITAL; priceAmount for ORIGINAL)
  currency: string;       // "EUR"
  framed: boolean;
  year?: number;
  image?: string;         // primary image (LG)
  publishedAt: number;    // epoch ms
  popularity?: number;    // default 0 (future: views/saves)
};

export interface SearchFilters {
  kind?: "ORIGINAL" | "EDITIONED" | "DIGITAL";
  category?: "Painting" | "Drawing" | "Photography" | "Digital";
  artistId?: string;
  framed?: boolean;
  year?: number;
  priceMin?: number;
  priceMax?: number;
}

export interface SearchOptions {
  query?: string;
  filters?: SearchFilters;
  sort?: string[];
  page?: number;
  hitsPerPage?: number;
  facets?: string[];
}

export interface SearchResult {
  hits: SearchArtworkDoc[];
  estimatedTotalHits: number;
  facetDistribution?: Record<string, Record<string, number>>;
  processingTimeMs: number;
}

export interface SearchSuggestion {
  artworks: Array<{
    title: string;
    slug: string;
    image?: string;
  }>;
  artists: Array<{
    name: string;
    slug: string;
  }>;
}
