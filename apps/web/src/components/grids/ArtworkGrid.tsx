import { ArtworkCard } from "@/components/domain/ArtworkCard";

interface ArtworkItem {
  id: string;
  slug: string;
  title: string;
  artistName: string;
  image: string;
  minPriceMinor?: number | null;
  priceMinor?: number | null;
  salePct?: number | null;
}

interface ArtworkGridProps {
  items: ArtworkItem[];
  locale: string;
  className?: string;
}

export function ArtworkGrid({ items, locale, className = "" }: ArtworkGridProps) {
  return (
    <div 
      className={`grid gap-6 ${className}`}
      style={{
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))"
      }}
    >
      {items.map((item) => (
        <ArtworkCard
          key={item.id}
          id={item.id}
          slug={item.slug}
          title={item.title}
          artistName={item.artistName}
          image={item.image}
          minPriceMinor={item.minPriceMinor}
          priceMinor={item.priceMinor}
          salePct={item.salePct}
          locale={locale}
        />
      ))}
    </div>
  );
}
