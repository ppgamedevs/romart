import Link from "next/link";
import Image from "next/image";
import ImpressionTracker from "./SimilarGridImpressions";
import QuickViewButton from "./QuickViewButton";

export const revalidate = 300;

type RecItem = {
  id: string;
  artistId: string;
  slug: string;
  title: string;
  thumbUrl: string;
  priceMinor: number;
  medium: string;
};

async function fetchMore(artistId: string): Promise<RecItem[]> {
  const api = process.env.API_URL || "http://localhost:3001";
  const r = await fetch(
    `${api}/recommendations/artist/${encodeURIComponent(artistId)}/more`,
    { cache: "no-store" }
  );
  if (!r.ok) return [];
  const data = await r.json();
  return (data?.items as RecItem[]) || [];
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

export default async function MoreFromArtist({
  artistId,
  excludeId,
  currency = "EUR",
  title = "More from this artist",
}: {
  artistId: string;
  excludeId?: string;
  currency?: string;
  title?: string;
}) {
  const itemsAll = await fetchMore(artistId);
  const items = excludeId ? itemsAll.filter((x) => x.id !== excludeId) : itemsAll;

  if (!items.length) return null;

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        <span className="text-xs opacity-60">{items.length} works</span>
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
                    alt={`${it.title} — by same artist`}
                    fill
                    sizes="(max-width:768px) 50vw, (max-width:1200px) 25vw, 25vw"
                    className="object-cover"
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
      <ImpressionTracker
        section="more-from-artist"
        itemIds={items.map((x) => x.id)}
        hrefs={items.map((x) => `/artwork/${x.slug}`)}
      />
    </section>
  );
}

/** Skeleton (pentru <Suspense fallback={...}>) */
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

export function MoreFromArtistSkeleton() {
  return (
    <section className="mt-10">
      <div className="mb-4 h-5 w-56 bg-neutral-200 rounded" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

(MoreFromArtist as any).Skeleton = MoreFromArtistSkeleton;
