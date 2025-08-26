import { Suspense } from "react";
import FilterChips from "@/components/discover/FilterChips";
import DiscoverGrid from "@/components/discover/DiscoverGrid";
import { TrendingGridSkeleton } from "@/components/recs/TrendingGrid";

export const metadata = {
  title: "Discover Romanian Art — Browse & Find Your Next Favorite",
  description:
    "Explore curated Romanian paintings, drawings, photography and digital art. Sort by popularity or price.",
};

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ medium?: string; sort?: string; page?: string }>;
}) {
  const params = await searchParams;
  const medium = params.medium || "all";
  const sort = params.sort || "popular";
  const page = params.page ? parseInt(params.page, 10) : 1;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Discover</h1>
      <FilterChips />
      <Suspense fallback={<TrendingGridSkeleton />}>
        <DiscoverGrid medium={medium} sort={sort} page={page} />
      </Suspense>
    </div>
  );
}
