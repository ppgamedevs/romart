import Link from "next/link";
import Image from "next/image";
import ImpressionTracker from "@/components/recs/SimilarGridImpressions";
import QuickViewButton from "@/components/recs/QuickViewButton";

export const revalidate = 120;

type Item = {
  id: string;
  artistId: string;
  slug: string;
  title: string;
  thumbUrl: string;
  priceMinor: number;
  medium: string;
};

async function fetchDiscover(params: {
  medium?: string;
  sort?: string;
  page?: number;
}) {
  const api = process.env.API_URL || "http://localhost:3001";
  const qs = new URLSearchParams();
  if (params.medium && params.medium !== "all") qs.set("medium", params.medium);
  if (params.sort) qs.set("sort", params.sort);
  if (params.page && params.page > 1) qs.set("page", String(params.page));

  const res = await fetch(`${api}/discover?${qs.toString()}`, { cache: "no-store" });
  if (!res.ok)
    return {
      items: [],
      total: 0,
      page: 1,
      pageSize: 24,
      hasNext: false,
    };
  return res.json() as Promise<{
    items: Item[];
    total: number;
    page: number;
    pageSize: number;
    hasNext: boolean;
  }>;
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

export default async function DiscoverGrid({
  medium,
  sort,
  page = 1,
}: {
  medium?: string;
  sort?: string;
  page?: number;
}) {
  const data = await fetchDiscover({ medium, sort, page });
  const { items } = data;

  if (!items.length) {
    return (
      <div className="py-12 text-center text-sm opacity-70">
        No results. Try a different medium or sort.
      </div>
    );
  }

  return (
    <section className="mt-6">
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
                     alt={`${it.title} — ${it.medium}`}
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
                   {money(it.priceMinor, "EUR")}
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
        section="discover"
        itemIds={items.map((x) => x.id)}
        hrefs={items.map((x) => `/artwork/${x.slug}`)}
      />
      {/* pagination minimal */}
      <Pagination
        current={data.page}
        hasNext={data.hasNext}
        total={data.total}
        pageSize={data.pageSize}
      />
    </section>
  );
}

function PageLink({
  page,
  children,
  disabled = false,
}: {
  page: number;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const q = new URLSearchParams(
    typeof window === "undefined" ? "" : window.location.search
  );
  q.set("page", String(page));
  const href = `?${q.toString()}`;

  return disabled ? (
    <span className="px-3 py-1 rounded border opacity-50">{children}</span>
  ) : (
    <a className="px-3 py-1 rounded border hover:bg-neutral-100" href={href}>
      {children}
    </a>
  );
}

function Pagination({
  current,
  hasNext,
}: {
  current: number;
  hasNext: boolean;
  total: number;
  pageSize: number;
}) {
  return (
    <div className="flex justify-center gap-2 mt-6">
      <PageLink page={Math.max(1, current - 1)} disabled={current <= 1}>
        Prev
      </PageLink>
      <span className="px-3 py-1 text-sm opacity-70">Page {current}</span>
      <PageLink page={current + 1} disabled={!hasNext}>
        Next
      </PageLink>
    </div>
  );
}
