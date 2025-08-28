import { Suspense } from "react";
import type { Metadata } from "next";
import FilterChips from "@/components/discover/FilterChips";
import DiscoverGrid from "@/components/discover/DiscoverGrid";
import { TrendingGridSkeleton } from "@/components/recs/TrendingGrid";

export const dynamic = 'force-dynamic'

function mediumLabel(m?: string) {
  switch ((m || "all").toLowerCase()) {
    case "painting": return "Painting";
    case "drawing": return "Drawing";
    case "photography": return "Photography";
    case "digital": return "Digital Art";
    default: return "All Media";
  }
}

function sortLabel(s?: string) {
  switch ((s || "popular").toLowerCase()) {
    case "price_asc": return "Price ↑";
    case "price_desc": return "Price ↓";
    default: return "Popular";
  }
}

export async function generateMetadata({ searchParams }:{
  searchParams: Promise<{ medium?: string; sort?: string }>
}): Promise<Metadata> {
  const params = await searchParams;
  const base = process.env.SITE_URL || "http://localhost:3000";
  const qs = new URLSearchParams();
  if (params.medium && params.medium !== "all") qs.set("medium", params.medium);
  if (params.sort) qs.set("sort", params.sort);
  const ogUrl = `${base}/api/og/discover?${qs.toString()}`;

  const title = `Discover — ${mediumLabel(params.medium)}`;
  const desc  = `Curated Romanian Art · ${sortLabel(params.sort)} · Browse ${mediumLabel(params.medium)}.`;

  return {
    title, 
    description: desc,
    openGraph: { 
      type: "website", 
      url: `${base}/discover`, 
      title, 
      description: desc, 
      images: [{ url: ogUrl }] 
    },
    twitter: { 
      card: "summary_large_image", 
      title, 
      description: desc, 
      images: [ogUrl] 
    },
  };
}

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
