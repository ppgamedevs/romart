import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMinor } from "@artfromromania/shared";
import { Image } from "@/components/ui/image";

interface ArtworkGridProps {
  items: Array<{
    id: string;
    slug: string;
    title: string;
    kind: "ORIGINAL" | "EDITIONED" | "DIGITAL";
    priceAmount: number | null;
    priceKind: "artwork" | "edition";
    primaryImageUrl: string | null;
    artist: {
      displayName: string;
      slug: string;
    };
  }>;
}

export function ArtworkGrid({ items }: ArtworkGridProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No artworks found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item) => (
        <Link key={item.id} href={`/artwork/${item.slug}`} className="group">
          <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg">
            <div className="aspect-square relative overflow-hidden">
              {item.primaryImageUrl ? (
                <Image
                  src={item.primaryImageUrl}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-200 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground">No image</span>
                </div>
              )}
              <div className="absolute top-2 left-2">
                <Badge variant="secondary" className="text-xs">
                  {item.kind}
                </Badge>
              </div>
            </div>
            <CardContent className="p-4">
              <h3 className="font-medium text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-muted-foreground mb-2">
                by {item.artist.displayName}
              </p>
              {item.priceAmount && (
                <p className="font-semibold text-sm">
                  {formatMinor(item.priceAmount)}
                </p>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
