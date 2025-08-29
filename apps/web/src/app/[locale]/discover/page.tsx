import Link from "next/link";
import Image from "next/image";
import { dict, t as T } from "@/components/i18n/t";

async function fetchSearch(sp: any) {
  try {
    const api = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const qs = new URLSearchParams(Object.entries(sp).filter(([_, v]) => v != null && v !== "") as any).toString();
    const r = await fetch(`${api}/public/search?${qs}`, { cache: "no-store" });
    if (!r.ok) throw new Error('API not available');
    return r.json();
  } catch (error) {
    // Return mock data when API is not available
    return {
      total: 8,
      items: [
        { id: "1", slug: "artwork-1", title: "Abstract Composition", artistName: "Maria Popescu", priceMinor: 150000 },
        { id: "2", slug: "artwork-2", title: "Urban Landscape", artistName: "Ion Vasilescu", priceMinor: 200000 },
        { id: "3", slug: "artwork-3", title: "Portrait Study", artistName: "Ana Dumitrescu", priceMinor: 120000 },
        { id: "4", slug: "artwork-4", title: "Modern Still Life", artistName: "George Ionescu", priceMinor: 180000 },
        { id: "5", slug: "artwork-5", title: "Expressionist Work", artistName: "Elena Marin", priceMinor: 160000 },
        { id: "6", slug: "artwork-6", title: "Small Study", artistName: "Vasile Popa", priceMinor: 45000 },
        { id: "7", slug: "artwork-7", title: "Sketch", artistName: "Diana Munteanu", priceMinor: 35000 },
        { id: "8", slug: "artwork-8", title: "Color Study", artistName: "Mihai Radu", priceMinor: 80000 }
      ],
      page: parseInt(sp.page) || 1,
      pageSize: parseInt(sp.pageSize) || 24
    };
  }
}

export default async function Discover({ searchParams, params }: { searchParams: any; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = T(locale);
  const view = searchParams.view === "list" ? "list" : "grid";
  const sp = { ...searchParams, page: searchParams.page || 1, pageSize: searchParams.pageSize || 24 };
  const data = await fetchSearch(sp);

  const mediums = [
    { k: "PAINTING", label: locale === "ro" ? "Pictură" : "Painting" },
    { k: "DRAWING", label: locale === "ro" ? "Desen" : "Drawing" },
    { k: "PHOTOGRAPHY", label: locale === "ro" ? "Fotografie" : "Photography" },
    { k: "DIGITAL", label: locale === "ro" ? "Digital" : "Digital" },
  ];

  function url(next: any) {
    return `/${locale}/discover?` + new URLSearchParams({ ...searchParams, ...next }).toString();
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">{t("discoverTitle")}</h1>

      {/* Filters row */}
      <form className="grid md:grid-cols-5 gap-2">
        <input 
          name="q" 
          defaultValue={searchParams.q || ""} 
          className="border rounded-lg px-3 py-2 md:col-span-2" 
          placeholder="Search…" 
        />
                 <select 
           name="medium" 
           defaultValue={searchParams.medium || ""} 
           className="border rounded-lg px-2 py-2"
         >
           <option value="">{locale === "ro" ? "Toate tehnicile" : "All media"}</option>
           {mediums.map(m => (
             <option key={m.k} value={m.k}>{m.label}</option>
           ))}
         </select>
         <select 
           name="orientation" 
           defaultValue={searchParams.orientation || ""} 
           className="border rounded-lg px-2 py-2"
         >
           <option value="">{locale === "ro" ? "Oricare" : "Any orientation"}</option>
          <option value="PORTRAIT">Portrait</option>
          <option value="LANDSCAPE">Landscape</option>
          <option value="SQUARE">Square</option>
        </select>
        <select 
          name="sort" 
          defaultValue={searchParams.sort || "relevance"} 
          className="border rounded-lg px-2 py-2"
        >
          <option value="relevance">Best match</option>
          <option value="newest">Newest</option>
          <option value="minprice_asc">Price from ↑</option>
          <option value="price_asc">List price ↑</option>
          <option value="price_desc">List price ↓</option>
          <option value="popularity">Popularity</option>
        </select>
      </form>

      {/* Shop by medium chips */}
      <div className="flex flex-wrap gap-2">
        {mediums.map(m => {
          const active = searchParams.medium === m.k;
          return (
            <a 
              key={m.k} 
              href={url({ medium: active ? "" : m.k, page: 1 })} 
              className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                active ? "bg-black text-white" : "bg-white hover:bg-gray-50"
              }`}
            >
              {m.label}
            </a>
          );
        })}
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-2 text-sm">
        <span className="opacity-60">View:</span>
        <a 
          href={url({ view: "grid" })} 
          className={`px-2 py-1 rounded border transition-colors ${
            view === "grid" ? "bg-black text-white" : "hover:bg-gray-50"
          }`}
        >
          {t("grid")}
        </a>
        <a 
          href={url({ view: "list" })} 
          className={`px-2 py-1 rounded border transition-colors ${
            view === "list" ? "bg-black text-white" : "hover:bg-gray-50"
          }`}
        >
          {t("list")}
        </a>
      </div>

      {/* Results */}
      {view === "grid" ? (
        <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))" }}>
          {data.items.map((a: any) => (
                         <a 
               key={a.id} 
               href={`/${locale}/artwork/${a.slug}`} 
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
                  {a.minPriceMinor != null ? (
                    <>From {(a.minPriceMinor / 100).toFixed(2)} €</>
                  ) : a.priceMinor != null ? (
                    <>{(a.priceMinor / 100).toFixed(2)} €</>
                  ) : (
                    <>Price on request</>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((a: any) => (
                         <a 
               key={a.id} 
               href={`/${locale}/artwork/${a.slug}`} 
               className="flex gap-3 rounded-2xl overflow-hidden border bg-card hover:shadow-soft transition-shadow"
             >
                             <div className="relative w-40 aspect-[4/5] bg-neutral-100 flex items-center justify-center">
                 <div className="text-center text-gray-500">
                   <div className="text-2xl mb-1">🖼️</div>
                   <div className="text-xs">{a.title}</div>
                 </div>
               </div>
              <div className="p-3 flex-1">
                <div className="font-medium">{a.title}</div>
                <div className="text-sm opacity-70">{a.artistName}</div>
                <div className="text-sm mt-1 opacity-80">
                  {a.minPriceMinor != null ? (
                    <>From {(a.minPriceMinor / 100).toFixed(2)} €</>
                  ) : a.priceMinor != null ? (
                    <>{(a.priceMinor / 100).toFixed(2)} €</>
                  ) : (
                    <>Price on request</>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <a 
          href={url({ page: Math.max(1, parseInt(data.page || 1) - 1) })} 
          className="px-3 py-1.5 rounded-lg border hover:bg-gray-50 transition-colors"
        >
          Prev
        </a>
        <div className="text-sm opacity-70">
          Page {data.page} of {Math.max(1, Math.ceil((data.total || 0) / (data.pageSize || 24)))}
        </div>
        <a 
          href={url({ page: (parseInt(data.page || 1) + 1) })} 
          className="px-3 py-1.5 rounded-lg border hover:bg-gray-50 transition-colors"
        >
          Next
        </a>
      </div>
    </div>
  );
}
