import { Metadata } from "next";
import { searchOrDbFallback } from "@/lib/search";
import { ArtworkGrid } from "@/components/catalog/ArtworkGrid";
import { Filters } from "@/components/catalog/Filters";
import { SortSelect } from "@/components/catalog/SortSelect";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Discover Art | RomArt",
  description: "Explore unique artworks from talented artists. Browse paintings, drawings, photography, and digital art.",
  openGraph: {
    title: "Discover Art | RomArt",
    description: "Explore unique artworks from talented artists",
    type: "website",
  },
};

interface DiscoverPageProps {
  searchParams: Promise<{
    page?: string;
    sort?: string;
    kind?: string;
    category?: string;
    priceMin?: string;
    priceMax?: string;
    framed?: string;
    year?: string;
  }>;
}

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const params = await searchParams;
  // Parse query parameters
  const page = parseInt(params.page || "1");
  const sort = params.sort || "newest";
  const kind = params.kind as "ORIGINAL" | "EDITIONED" | "DIGITAL" | undefined;
  const category = params.category as any;
  const priceMin = params.priceMin ? parseInt(params.priceMin) : undefined;
  const priceMax = params.priceMax ? parseInt(params.priceMax) : undefined;
  const framed = params.framed === "true";
  const year = params.year ? parseInt(params.year) : undefined;

  // Fetch catalog data using search or database fallback
  const result = await searchOrDbFallback({
    page,
    hitsPerPage: 12,
    filters: {
      kind,
      category,
      priceMin,
      priceMax,
      framed: params.framed ? framed : undefined,
      year,
    },
    sort: sort === "newest" ? ["publishedAt:desc"] : 
          sort === "price_asc" ? ["price:asc"] : 
          sort === "price_desc" ? ["price:desc"] : 
          ["publishedAt:desc"],
    facets: ["kind", "category", "year", "framed"],
  });

  const totalPages = Math.ceil(result.estimatedTotalHits / 12);

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Discover Art</h1>
        <p className="text-muted-foreground mt-2">
          Explore unique artworks from talented artists
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="space-y-6">
          <Filters facets={result.facetDistribution} />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {result.estimatedTotalHits} artwork{result.estimatedTotalHits !== 1 ? 's' : ''} found
            </p>
            <SortSelect />
          </div>

          {/* Artworks Grid */}
          <ArtworkGrid items={result.hits.map(hit => ({
            id: hit.id,
            slug: hit.slug,
            title: hit.title,
            kind: hit.kind,
            priceAmount: hit.price,
            priceKind: "artwork" as const,
            primaryImageUrl: hit.image || null,
            artist: {
              displayName: hit.artistName,
              slug: hit.artistSlug,
            },
          }))} />

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                {page > 1 && (
                  <PaginationItem>
                    <PaginationPrevious href={`/discover?${new URLSearchParams({
                      ...params,
                      page: (page - 1).toString()
                    })}`} />
                  </PaginationItem>
                )}
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href={`/discover?${new URLSearchParams({
                          ...params,
                          page: pageNum.toString()
                        })}`}
                        isActive={pageNum === page}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                {page < totalPages && (
                  <PaginationItem>
                    <PaginationNext href={`/discover?${new URLSearchParams({
                      ...params,
                      page: (page + 1).toString()
                    })}`} />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </div>
    </div>
  );
}
