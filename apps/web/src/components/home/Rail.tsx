import Link from "next/link";
import Image from "next/image";

export function ArtworkRail({ title, items, locale }: { title: string; items: any[]; locale: string }) {
  if (!items?.length) return null;
  
  return (
    <section className="mt-8">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Link href={`/${locale}/discover`} className="text-sm underline opacity-70 hover:opacity-100 transition-opacity">
          See all
        </Link>
      </div>
      <div className="mt-4 grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
        {items.map((a) => (
          <Link 
            key={a.id} 
            href={`/${locale}/artwork/${a.id}`} 
            className="block rounded-2xl overflow-hidden border bg-card hover:shadow-soft transition-shadow"
          >
                         <div className="relative h-60 bg-neutral-100 flex items-center justify-center">
               <div className="text-center text-gray-500">
                 <div className="text-4xl mb-2">🖼️</div>
                 <div className="text-sm">{a.title}</div>
               </div>
             </div>
            <div className="p-3">
              <div className="text-sm font-medium line-clamp-1">{a.title}</div>
              <div className="text-xs opacity-70 line-clamp-1">{a.artistName}</div>
              <div className="text-xs mt-1 opacity-80">
                {a.priceMinor != null ? (
                  <>{(a.priceMinor / 100).toFixed(2)} €</>
                ) : (
                  <>Price on request</>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function CollectionsRail({ title, items, locale }: { title: string; items: any[]; locale: string }) {
  if (!items?.length) return null;
  
  return (
    <section className="mt-8">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Link href={`/${locale}/collections`} className="text-sm underline opacity-70 hover:opacity-100 transition-opacity">
          All collections
        </Link>
      </div>
      <div className="mt-4 grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
        {items.map((c) => (
          <Link 
            key={c.id} 
            href={`/${locale}/collection/${c.id}`} 
            className="block rounded-2xl overflow-hidden border bg-card hover:shadow-soft transition-shadow"
          >
                         <div className="relative h-44 bg-neutral-100 flex items-center justify-center">
               <div className="text-center text-gray-500">
                 <div className="text-3xl mb-2">📚</div>
                 <div className="text-sm">{c.name}</div>
               </div>
             </div>
            <div className="p-3">
              <div className="font-medium line-clamp-1">{c.name}</div>
              {c.description && (
                <div className="text-sm opacity-70 line-clamp-1">{c.description}</div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
