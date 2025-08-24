import { FastifyInstance } from "fastify";
import { getArtworksIndex, isMeilisearchAvailable } from "@artfromromania/search";
import type { SearchOptions, SearchFilters } from "@artfromromania/search";

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

export async function searchRoutes(fastify: FastifyInstance) {
  // Search artworks
  fastify.get("/search", async (request, reply) => {
    if (!isMeilisearchAvailable()) {
      return reply.status(503).send({ 
        error: "Search service is not available",
        details: "Meilisearch is not configured or not running"
      });
    }

    try {
      const query = request.query as any;
      
      const searchOptions: SearchOptions = {
        query: query.q || "",
        page: query.page ? parseInt(query.page) : 1,
        hitsPerPage: query.hitsPerPage ? parseInt(query.hitsPerPage) : 12,
        sort: query.sort ? [query.sort] : undefined,
        facets: query.facets ? query.facets.split(",") : undefined,
      };

      // Parse filters
      if (query.kind || query.category || query.artistId || query.framed !== undefined || query.year || query.priceMin || query.priceMax) {
        searchOptions.filters = {
          kind: query.kind,
          category: query.category,
          artistId: query.artistId,
          framed: query.framed === "true" ? true : query.framed === "false" ? false : undefined,
          year: query.year ? parseInt(query.year) : undefined,
          priceMin: query.priceMin ? parseInt(query.priceMin) : undefined,
          priceMax: query.priceMax ? parseInt(query.priceMax) : undefined,
        };
      }

      const index = getArtworksIndex();
      
      const searchParams: any = {
        query: searchOptions.query || "",
        filter: buildMeiliFilter(searchOptions.filters),
        sort: searchOptions.sort,
        page: searchOptions.page || 1,
        hitsPerPage: searchOptions.hitsPerPage || 12,
      };

      if (searchOptions.facets) {
        searchParams.facets = searchOptions.facets;
      }

      const result = await index.search(searchParams.query, searchParams);
      
      return {
        hits: result.hits,
        estimatedTotalHits: result.estimatedTotalHits || 0,
        facetDistribution: result.facetDistribution,
        processingTimeMs: result.processingTimeMs || 0,
      };
    } catch (error) {
      console.error("Search error:", error);
      return reply.status(500).send({ 
        error: "Search failed",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Search suggestions
  fastify.get("/search/suggest", async (request, reply) => {
    if (!isMeilisearchAvailable()) {
      return reply.status(503).send({ 
        error: "Search service is not available",
        details: "Meilisearch is not configured or not running"
      });
    }

    try {
      const query = request.query as any;
      const searchQuery = query.q;
      const limit = query.limit ? parseInt(query.limit) : 5;

      if (!searchQuery || searchQuery.trim().length === 0) {
        return { artworks: [], artists: [] };
      }

      const index = getArtworksIndex();
      const result = await index.search(searchQuery.trim(), {
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
      console.error("Search suggestions error:", error);
      return reply.status(500).send({ 
        error: "Failed to get suggestions",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}
