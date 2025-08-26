import Link from "next/link";
import Image from "next/image";
import QuickViewButton from "./QuickViewButton";
import ImpressionTracker from "./SimilarGridImpressions"; // Client helper

export const revalidate = 300; // 5 min cache on server

type SimilarItem = {
  id: string;
  artistId: string;
  slug: string;
  title: string;
  thumbUrl: string;
  priceMinor: number;
  medium: string;
};

async function fetchSimilar(artworkId: string): Promise<SimilarItem[]> {
  const api = process.env.API_URL || "http://localhost:3001";
  const res = await fetch(
    `${api}/recommendations/artwork/${encodeURIComponent(artworkId)}/similar`,
    { cache: "no-store" } // dacă preferi cache soft, înlocuiește cu { next: { revalidate: 300 } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data?.items as SimilarItem[]) || [];
}

function money(minor: number, currency = "EUR") {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(minor / 100);
  } catch {
    return (minor / 100).toFixed(2) + " €";
  }
}

export default async function SimilarGrid({
  artworkId,
  currency = "EUR",
}: {
  artworkId: string;
  currency?: string;
}) {
  const items = await fetchSimilar(artworkId);
  if (!items.length) {
    return null; // nimic de afișat (poți pune fallback)
  }

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-xl font-semibold">Similar works</h2>
        <span className="text-xs opacity-60">{items.length} suggestions</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((it) => (
          <article
            key={it.id}
            className="group rounded-2xl border overflow-hidden hover:shadow-sm transition-shadow relative"
          >
            <Link href={`/artwork/${it.slug}`} className="block">
              <div className="relative aspect-[4/3] bg-neutral-100">
                {!!it.thumbUrl && (
                  <Image
                    src={it.thumbUrl}
                    alt={`${it.title} — similar artwork`}
                    fill
                    sizes="(max-width:768px) 50vw, (max-width:1200px) 25vw, 25vw"
                    className="object-cover"
                    priority={false}
                  />
                )}
              </div>
              <div className="p-3">
                <div className="line-clamp-1 text-sm font-medium">{it.title}</div>
                <div className="mt-1 text-xs uppercase tracking-wide opacity-70">
                  {it.medium}
                </div>
                <div className="mt-2 text-sm font-semibold">
                  {money(it.priceMinor, currency)}
                </div>
              </div>
            </Link>

            {/* overlay top-right */}
            <div className="absolute top-2 right-2">
              <QuickViewButton artworkId={it.id} slug={it.slug} />
            </div>
          </article>
        ))}
      </div>
      {/* tracker client-side pentru impresii/CTR */}
      <ImpressionTracker
        section="similar"
        itemIds={items.map((x) => x.id)}
        hrefs={items.map((x) => `/artwork/${x.slug}`)}
      />
    </section>
  );
}

/** Skeleton pentru <Suspense fallback={<SimilarGrid.Skeleton />}> */
function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border overflow-hidden">
      <div className="aspect-[4/3] bg-neutral-100" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-neutral-200 rounded" />
        <div className="h-3 w-1/2 bg-neutral-200 rounded" />
      </div>
    </div>
  );
}

export function SimilarGridSkeleton() {
  return (
    <section className="mt-10">
      <div className="mb-4 h-5 w-40 bg-neutral-200 rounded" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

// exportă ca namespace-friendly
(SimilarGrid as any).Skeleton = SimilarGridSkeleton;
