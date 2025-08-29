import { ArtworkGrid } from "@/components/grids/ArtworkGrid";

interface Artwork {
  id: string;
  slug: string;
  title: string;
  artistName: string;
  image: string;
  minPriceMinor?: number | null;
  priceMinor?: number | null;
  salePct?: number | null;
}

interface ArtistWorksProps {
  artworks: Artwork[];
  locale: string;
}

export function ArtistWorks({ artworks, locale }: ArtistWorksProps) {
  if (artworks.length === 0) {
    return (
      <div className="container">
        <div className="text-center py-12">
          <p className="text-muted">
            {locale === "ro" 
              ? "Nu există lucrări publicate încă."
              : "No published artworks yet."
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <ArtworkGrid items={artworks} locale={locale} />
    </div>
  );
}
