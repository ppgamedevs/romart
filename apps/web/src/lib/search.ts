import { getArtworksIndex, getSearchClient } from "@artfromromania/search";
import { getCatalogPage } from "@artfromromania/db";
import type { SearchOptions, SearchResult, SearchFilters } from "@artfromromania/search";
import type { CatalogFilters, CatalogResult } from "@artfromromania/db";

// Check if Meilisearch is configured
function isMeilisearchAvailable(): boolean {
  return !!(process.env.NEXT_PUBLIC_MEILI_HOST && process.env.NEXT_PUBLIC_MEILI_SEARCH_KEY);
}

// Convert search filters to Meilisearch filter string
function buildMeiliFilter(filters?: SearchFilters): string | undefined {
  if (!filters) return undefined;

  const conditions: string[] = [];

  if (filters.kind) {
    conditions.push(`kind = "${filters.kind}"`);
  }

  if (filters.category) {
    conditions.push(`category = "${filters.category}"`);
  }

  if (filters.artistId) {
    conditions.push(`artistId = "${filters.artistId}"`);
  }

  if (filters.framed !== undefined) {
    conditions.push(`framed = ${filters.framed}`);
  }

  if (filters.year) {
    conditions.push(`year = ${filters.year}`);
  }

  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    let priceFilter = "price";
    if (filters.priceMin !== undefined) {
      priceFilter += ` >= ${filters.priceMin}`;
    }
    if (filters.priceMax !== undefined) {
      priceFilter += ` <= ${filters.priceMax}`;
    }
    conditions.push(priceFilter);
  }

  return conditions.length > 0 ? conditions.join(" AND ") : undefined;
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
    })),
    estimatedTotalHits: dbResult.total,
    processingTimeMs: 0,
  };
}

export async function searchOrDbFallback(options: SearchOptions): Promise<SearchResult> {
  if (isMeilisearchAvailable()) {
    try {
      const index = getArtworksIndex();
      
      const searchParams: any = {
        query: options.query || "",
        filter: buildMeiliFilter(options.filters),
        sort: options.sort,
        page: options.page || 1,
        hitsPerPage: options.hitsPerPage || 12,
      };

      if (options.facets) {
        searchParams.facets = options.facets;
      }

      const result = await index.search(searchParams.query, searchParams);
      
      return {
        hits: result.hits as any,
        estimatedTotalHits: result.estimatedTotalHits || 0,
        facetDistribution: result.facetDistribution,
        processingTimeMs: result.processingTimeMs || 0,
      };
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
      const index = getArtworksIndex();
      const result = await index.search(query, {
        limit,
        attributesToRetrieve: ["title", "slug", "image", "artistName", "artistSlug"],
      });

      const artworks = result.hits.map((hit: any) => ({
        title: hit.title,
        slug: hit.slug,
        image: hit.image,
      }));

      const artists = result.hits
        .map((hit: any) => ({
          name: hit.artistName,
          slug: hit.artistSlug,
        }))
        .filter((artist: any, index: number, self: any[]) => 
          self.findIndex(a => a.slug === artist.slug) === index
        );

      return { artworks, artists };
    } catch (error) {
      console.warn("Meilisearch suggestions failed:", error);
      return { artworks: [], artists: [] };
    }
  }

  // Fallback: return empty suggestions
  return { artworks: [], artists: [] };
}
