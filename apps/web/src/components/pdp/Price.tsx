import PriceBreakdown from "./PriceBreakdown";

export function PriceBlock({ artwork }: { artwork: any }) {
  const list = artwork.onSale && artwork.saleMinor ? artwork.priceMinor : null;
  const sale = artwork.onSale && artwork.saleMinor ? artwork.saleMinor : null;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        {sale ? (
          <>
            <div className="text-2xl font-semibold">
              {(sale / 100).toFixed(2)} {artwork.currency || "EUR"}
            </div>
            <div className="text-lg line-through opacity-60">
              {(list! / 100).toFixed(2)} {artwork.currency || "EUR"}
            </div>
          </>
        ) : (
          <div className="text-2xl font-semibold">
            {(artwork.priceMinor / 100).toFixed(2)} {artwork.currency || "EUR"}
          </div>
        )}
        {/* Free shipping chip (pe baza pragurilor ENV) */}
        <span className="ml-auto text-xs px-2 py-1 rounded-full border bg-neutral-50">
          {artwork.medium === "DIGITAL" 
            ? "Instant download" 
            : "Free RO ≥ 250€ · Intl ≥ 1500€"
          }
        </span>
      </div>

      {/* breakdown live (folosește country detect/selector) */}
      {/* @ts-expect-error client */}
      <PriceBreakdown artworkId={artwork.id} />
    </div>
  );
}
