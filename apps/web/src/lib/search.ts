import { getCatalogPage } from "@artfromromania/db";
import type { SearchOptions, SearchResult, SearchFilters } from "@artfromromania/search";
import type { CatalogFilters, CatalogResult } from "@artfromromania/db";

// Check if Meilisearch API is configured
function isMeilisearchAvailable(): boolean {
  return !!(process.env.NEXT_PUBLIC_MEILI_HOST && process.env.NEXT_PUBLIC_MEILI_SEARCH_KEY);
}

// Convert database result to search result format
function dbToSearchResult(dbResult: CatalogResult): SearchResult {
  return {
    hits: dbResult.items.map(item => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      kind: item.kind,
      category: "Painting" as any, // Default category for DB fallback
      artistId: "", // Not available in DB result
      artistName: item.artist.displayName,
      artistSlug: item.artist.slug,
      price: item.priceAmount || 0,
      currency: "EUR",
      framed: false, // Not available in DB result
      year: undefined, // Not available in DB result
      image: item.primaryImageUrl || undefined,
      publishedAt: 0, // Not available in DB result
      popularity: 0,
      // Moderation fields - default to safe for DB fallback
      moderationStatus: "APPROVED" as const,
      contentRating: "SAFE" as const,
      flaggedCount: 0,
    })),
    estimatedTotalHits: dbResult.total,
    processingTimeMs: 0,
  };
}

export async function searchOrDbFallback(options: SearchOptions): Promise<SearchResult> {
  if (isMeilisearchAvailable()) {
    try {
      const apiUrl = new URL("/search", process.env.API_URL || "http://localhost:3001");
      
      // Build query parameters
      const params = new URLSearchParams();
      if (options.query) params.append("q", options.query);
      if (options.page) params.append("page", options.page.toString());
      if (options.hitsPerPage) params.append("hitsPerPage", options.hitsPerPage.toString());
      if (options.sort) params.append("sort", options.sort.join(","));
      if (options.facets) params.append("facets", options.facets.join(","));
      
      // Add filters
      if (options.filters) {
        if (options.filters.kind) params.append("kind", options.filters.kind);
        if (options.filters.category) params.append("category", options.filters.category);
        if (options.filters.artistId) params.append("artistId", options.filters.artistId);
        if (options.filters.framed !== undefined) params.append("framed", options.filters.framed.toString());
        if (options.filters.year) params.append("year", options.filters.year.toString());
        if (options.filters.priceMin !== undefined) params.append("priceMin", options.filters.priceMin.toString());
        if (options.filters.priceMax !== undefined) params.append("priceMax", options.filters.priceMax.toString());
      }

      const response = await fetch(`${apiUrl}?${params}`);
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.warn("Meilisearch search failed, falling back to database:", error);
      // Fall through to database
    }
  }

  // Fallback to database
  const dbFilters: CatalogFilters = {
    page: options.page || 1,
    pageSize: options.hitsPerPage || 12,
    kind: options.filters?.kind,
    category: options.filters?.category,
    priceMin: options.filters?.priceMin,
    priceMax: options.filters?.priceMax,
    hasFrame: options.filters?.framed,
    year: options.filters?.year,
    sort: options.sort?.[0]?.replace(":desc", "_desc").replace(":asc", "_asc") as any,
  };

  const dbResult = await getCatalogPage(dbFilters);
  return dbToSearchResult(dbResult);
}

export async function searchSuggestions(query: string, limit = 5) {
  if (isMeilisearchAvailable()) {
    try {
      const apiUrl = new URL("/search/suggest", process.env.API_URL || "http://localhost:3001");
      const params = new URLSearchParams({
        q: query,
        limit: limit.toString(),
      });

      const response = await fetch(`${apiUrl}?${params}`);
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.warn("Meilisearch suggestions failed:", error);
      return { artworks: [], artists: [] };
    }
  }

  // Fallback: return empty suggestions
  return { artworks: [], artists: [] };
}
