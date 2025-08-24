"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { CATEGORIES, SORT_LABELS, type SortOption } from "@artfromromania/shared";
import { formatMinor } from "@artfromromania/shared";

interface FiltersProps {
  facets?: {
    categories: Array<{ category: string; count: number }>;
    kinds: Array<{ kind: string; count: number }>;
    priceRange: { min: number; max: number };
  } | Record<string, Record<string, number>>;
}

export function Filters({ facets }: FiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle Meilisearch facet distribution format
  const isMeiliFacets = facets && !Array.isArray((facets as any).categories);
  const meiliFacets = isMeiliFacets ? facets as Record<string, Record<string, number>> : null;
  const dbFacets = !isMeiliFacets ? facets as any : null;

  // Convert Meilisearch facets to expected format
  const normalizedFacets = {
    categories: meiliFacets?.category ? 
      Object.entries(meiliFacets.category).map(([category, count]) => ({ category, count })) :
      dbFacets?.categories || [],
    kinds: meiliFacets?.kind ? 
      Object.entries(meiliFacets.kind).map(([kind, count]) => ({ kind, count })) :
      dbFacets?.kinds || [],
    priceRange: dbFacets?.priceRange || { min: 0, max: 1000000 },
  } as {
    categories: Array<{ category: string; count: number }>;
    kinds: Array<{ kind: string; count: number }>;
    priceRange: { min: number; max: number };
  };

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    // Reset to page 1 when filters change
    params.delete("page");
    
    router.push(`/discover?${params.toString()}`);
  };

  const resetFilters = () => {
    router.push("/discover");
  };

  const currentKind = searchParams.get("kind");
  const currentCategory = searchParams.get("category");
  const currentPriceMin = searchParams.get("priceMin");
  const currentPriceMax = searchParams.get("priceMax");
  const currentFramed = searchParams.get("framed");
  const currentYear = searchParams.get("year");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          <Button variant="outline" size="sm" onClick={resetFilters}>
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Kind Filter */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Type</h4>
          <div className="space-y-2">
            {normalizedFacets.kinds.map(({ kind, count }) => (
              <div key={kind} className="flex items-center space-x-2">
                <Checkbox
                  id={`kind-${kind}`}
                  checked={currentKind === kind}
                  onCheckedChange={(checked) => {
                    updateFilters({ kind: checked ? kind : null });
                  }}
                />
                <Label htmlFor={`kind-${kind}`} className="text-sm">
                  {kind} ({count})
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Category Filter */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Category</h4>
          <div className="space-y-2">
            {normalizedFacets.categories.map(({ category, count }) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category}`}
                  checked={currentCategory === category}
                  onCheckedChange={(checked) => {
                    updateFilters({ category: checked ? category : null });
                  }}
                />
                <Label htmlFor={`category-${category}`} className="text-sm">
                  {category} ({count})
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Price Range Filter */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Price Range</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="Min"
                value={currentPriceMin || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  updateFilters({ priceMin: value || null });
                }}
                className="text-sm"
              />
              <span className="text-sm text-muted-foreground">to</span>
              <Input
                type="number"
                placeholder="Max"
                value={currentPriceMax || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  updateFilters({ priceMax: value || null });
                }}
                className="text-sm"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Range: {formatMinor(normalizedFacets.priceRange.min)} - {formatMinor(normalizedFacets.priceRange.max)}
            </p>
          </div>
        </div>

        <Separator />

        {/* Framed Filter */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="framed" className="text-sm font-medium">
              Framed
            </Label>
            <Switch
              id="framed"
              checked={currentFramed === "true"}
              onCheckedChange={(checked) => {
                updateFilters({ framed: checked ? "true" : null });
              }}
            />
          </div>
        </div>

        <Separator />

        {/* Year Filter */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Year</h4>
          <Input
            type="number"
            placeholder="e.g., 2023"
            value={currentYear || ""}
            onChange={(e) => {
              const value = e.target.value;
              updateFilters({ year: value || null });
            }}
            className="text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );
}
