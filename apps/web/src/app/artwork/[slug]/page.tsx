import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArtworkBySlug, getRelatedArtworks } from "@artfromromania/db";
import { visualArtworkJsonLd } from "@artfromromania/shared";
import { ArtworkGallery } from "@/components/pdp/ArtworkGallery";
import { Price } from "@/components/pdp/Price";
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

export const revalidate = 300; // 5 minutes

interface ArtworkPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ArtworkPageProps): Promise<Metadata> {
  const { slug } = await params;
  const artwork = await getArtworkBySlug(slug);
  
  if (!artwork) {
    return {
      title: "Artwork Not Found",
    };
  }

  const primaryImage = artwork.images.find((img: any) => img.position === 0) || artwork.images[0];
  const description = `${artwork.title} by ${artwork.artist.displayName}. ${artwork.medium ? `${artwork.medium}.` : ""} ${artwork.year ? `Created in ${artwork.year}.` : ""}`;

  return {
    title: `${artwork.title} by ${artwork.artist.displayName} | RomArt`,
    description,
    openGraph: {
      title: `${artwork.title} by ${artwork.artist.displayName}`,
      description,
      type: "website",
      images: primaryImage ? [primaryImage.url] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${artwork.title} by ${artwork.artist.displayName}`,
      description,
      images: primaryImage ? [primaryImage.url] : [],
    },
  };
}

export default async function ArtworkPage({ params }: ArtworkPageProps) {
  const { slug } = await params;
  const artwork = await getArtworkBySlug(slug);

  if (!artwork) {
    notFound();
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

  return (
    <>
      {/* JSON-LD Structured Data */}
      <BreadcrumbsJsonLd items={breadcrumbItems} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            visualArtworkJsonLd({
              artwork: {
                ...artwork,
                widthCm: artwork.widthCm ? Number(artwork.widthCm) : null,
                heightCm: artwork.heightCm ? Number(artwork.heightCm) : null,
                depthCm: artwork.depthCm ? Number(artwork.depthCm) : null,
                artist: artwork.artist,
                images: artwork.images.map((img: any) => ({
                  url: img.url,
                  alt: img.alt || undefined
                })),
                editions: artwork.editions
              },
              primaryImageUrl: primaryImage?.url || "",
              offer: {
                price,
                currency: "EUR",
                availability
              }
            })
          )
        }}
      />

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
            {artwork.priceAmount && (
              <div className="text-2xl font-bold">
                <Price amount={artwork.priceAmount} />
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
      </div>
    </>
  );
}
