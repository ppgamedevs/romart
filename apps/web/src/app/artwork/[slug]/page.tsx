import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getArtworkBySlug, getRelatedArtworks } from "@artfromromania/db";
import { visualArtworkJsonLd } from "@artfromromania/shared";
import { ArtworkGallery } from "@/components/pdp/ArtworkGallery";
import { PriceBlock } from "@/components/pdp/Price";
import { Breadcrumbs, BreadcrumbsJsonLd } from "@/components/pdp/Breadcrumbs";
import { PurchaseButtons } from "./PurchaseButtons";
import { ArtworkGrid } from "@/components/catalog/ArtworkGrid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ShoppingCart, Download, Palette, Calendar, Ruler, Frame } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import SimilarGrid, { SimilarGridSkeleton } from "@/components/recs/SimilarGrid";
import MoreFromArtist, { MoreFromArtistSkeleton } from "@/components/recs/MoreFromArtist";
import SeoJsonLd from "@/components/SeoJsonLd";
import { canonical, ldVisualArtwork } from "@/lib/seo";
import { ArtworkTracker } from "@/components/tracking/ArtworkTracker";

export const revalidate = 300; // 5 minutes

async function fetchArtwork(slug: string) {
  const api = process.env.API_URL || "http://localhost:3001";
  const r = await fetch(`${api}/public/artwork/by-slug/${slug}`, { cache: "no-store" });
  if (!r.ok) return null;
  return r.json();
}

interface ArtworkPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ArtworkPageProps): Promise<Metadata> {
  const { slug } = await params;
  const base = process.env.SITE_URL || "http://localhost:3000";
  const a = await fetchArtwork(slug);
  
  if (!a) {
    return { title: "Artwork not found — Art from Romania" };
  }
  
  const url = canonical(base, `/artwork/${a.slug}`);
  const title = `${a.title} — ${a.artist?.displayName || "Romanian Art"}`;
  const desc = a.description || `${a.title} — ${a.medium || "artwork"} by ${a.artist?.displayName || "artist"}.`;
  const ogImg = a.heroUrl || a.thumbUrl || process.env.NEXT_PUBLIC_OG_IMAGE_FALLBACK;

  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title,
      description: desc,
    },
    twitter: {
      card: "summary_large_image",
      title, 
      description: desc,
    },
  };
}

export default async function ArtworkPage({ params }: ArtworkPageProps) {
  const { slug } = await params;
  const artwork = await getArtworkBySlug(slug);

  if (!artwork) {
    notFound();
  }

  // Canonical slug enforcement
  if (slug !== artwork.slug) {
    redirect(`/artwork/${artwork.slug}`);
  }

  const primaryImage = artwork.images.find((img: any) => img.isPrimary) || artwork.images[0];
  const printEditions = artwork.editions.filter((edition: any) => edition.type === "PRINT");
  const otherEditions = artwork.editions.filter((edition: any) => edition.type !== "PRINT");

  // Get related artworks
  const relatedArtworks = await getRelatedArtworks(
    artwork.id,
    artwork.artistId,
    artwork.category || "",
    6
  );

  // Transform related artworks for the grid
  const relatedItems = relatedArtworks.map((item: any) => ({
    id: item.id,
    slug: item.slug,
    title: item.title,
    kind: item.kind,
    priceAmount: item.kind === "ORIGINAL" ? item.priceAmount : (item.editions[0]?.unitAmount || null),
    priceKind: item.kind === "ORIGINAL" ? "artwork" as const : "edition" as const,
    primaryImageUrl: item.primaryImage?.url || null,
    artist: item.artist
  }));

  // Calculate dimensions in inches
  const widthInches = artwork.widthCm ? Math.round(Number(artwork.widthCm) / 2.54) : null;
  const heightInches = artwork.heightCm ? Math.round(Number(artwork.heightCm) / 2.54) : null;

  // Determine availability and price for JSON-LD
  let availability: "InStock" | "OutOfStock" = "InStock";
  let price = 0;

  if (artwork.kind === "ORIGINAL") {
    price = artwork.priceAmount || 0;
    availability = artwork.status === "PUBLISHED" ? "InStock" : "OutOfStock";
  } else {
    const availableEdition = artwork.editions.find((ed: any) => ed.available && ed.available > 0);
    price = availableEdition?.unitAmount || 0;
    availability = availableEdition ? "InStock" : "OutOfStock";
  }

  // Breadcrumb items
  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Discover", url: "/discover" },
    { name: artwork.title, url: `/artwork/${artwork.slug}` }
  ];

  // SEO JSON-LD
  const base = process.env.SITE_URL || "http://localhost:3000";
  const url = canonical(base, `/artwork/${artwork.slug}`);
  const ld = ldVisualArtwork({
    url, 
    name: artwork.title, 
    description: artwork.description,
    image: [artwork.heroUrl, artwork.thumbUrl].filter(Boolean),
    medium: artwork.medium,
    widthCm: artwork.widthCm, 
    heightCm: artwork.heightCm, 
    depthCm: artwork.depthCm,
    priceMinor: artwork.priceMinor, 
    currency: artwork.currency, 
    available: artwork.available,
    artist: { 
      name: artwork.artist?.displayName, 
      url: canonical(base, `/artist/${artwork.artist?.slug}`) 
    }
  });

  return (
    <>
      {/* Tracking */}
      <ArtworkTracker artworkId={artwork.id} artistId={artwork.artistId} />
      
      {/* JSON-LD Structured Data */}
      <BreadcrumbsJsonLd items={breadcrumbItems} />
      <SeoJsonLd data={ld} />

      <div className="container mx-auto py-8 space-y-8">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <ArtworkGallery 
            images={artwork.images.map((img: any) => ({
              id: img.id,
              url: img.url,
              alt: img.alt || undefined
            }))}
            title={artwork.title}
          />

          {/* Artwork Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{artwork.title}</h1>
              <p className="text-lg text-muted-foreground">
                by{" "}
                <Link
                  href={`/artist/${artwork.artist.slug}`}
                  className="text-foreground hover:underline"
                >
                  {artwork.artist.displayName}
                </Link>
              </p>
            </div>

            {/* Price */}
            {artwork.priceMinor && (
              <div className="text-2xl font-bold">
                <PriceBlock artwork={artwork} />
              </div>
            )}

            {/* Artwork Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {artwork.year && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{artwork.year}</span>
                    </div>
                  )}
                  {artwork.medium && (
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4 text-muted-foreground" />
                      <span>{artwork.medium}</span>
                    </div>
                  )}
                  {(artwork.widthCm || artwork.heightCm) && (
                    <div className="flex items-center gap-2">
                      <Ruler className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {Number(artwork.widthCm)} × {Number(artwork.heightCm)} cm
                                                  {artwork.depthCm && ` × ${Number(artwork.depthCm)} cm`}
                        {widthInches && heightInches && (
                          <span className="text-muted-foreground ml-1">
                            ({widthInches} × {heightInches} in)
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  {artwork.framed && (
                    <div className="flex items-center gap-2">
                      <Frame className="h-4 w-4 text-muted-foreground" />
                      <span>Framed</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Purchase Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Purchase</CardTitle>
              </CardHeader>
              <CardContent>
                <PurchaseButtons 
                  artwork={artwork}
                  editions={artwork.editions}
                />
              </CardContent>
            </Card>


          </div>
        </div>

        {/* Related Works */}
        {relatedItems.length > 0 && (
          <div className="space-y-6">
            <Separator />
            <div>
              <h2 className="text-2xl font-bold mb-4">Related Works</h2>
              <ArtworkGrid items={relatedItems} />
            </div>
          </div>
        )}

        {/* Recommendations */}
        <Suspense fallback={<SimilarGridSkeleton />}>
          <SimilarGrid 
            artworkId={artwork.id} 
            currency={artwork.currency || "EUR"} 
          />
        </Suspense>

        <Suspense fallback={<MoreFromArtistSkeleton />}>
          <MoreFromArtist 
            artistId={artwork.artistId} 
            excludeId={artwork.id}
            currency={artwork.currency || "EUR"} 
          />
        </Suspense>
      </div>
    </>
  );
}
