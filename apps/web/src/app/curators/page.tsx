import Image from "next/image";
import Link from "next/link";

export const dynamic = 'force-dynamic';

async function fetchCurators() {
  const api = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const r = await fetch(`${api}/public/curators`, { cache: "no-store" });
  if (!r.ok) return { items: [] as any[] };
  return r.json() as Promise<{ items: any[] }>;
}

export default async function CuratorsPage() {
  const { items } = await fetchCurators();
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-semibold">Our Curators</h1>
      <p className="opacity-70 mt-1">Choose a curator or let us auto-assign the next available.</p>
      
      <div className="mt-6 grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        {items.map(c => (
          <article key={c.slug} className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 rounded-full overflow-hidden bg-neutral-100">
                {c.avatarUrl && (
                  <Image 
                    src={c.avatarUrl} 
                    alt={c.displayName} 
                    fill 
                    className="object-cover" 
                  />
                )}
              </div>
              <div>
                <div className="font-medium">{c.displayName}</div>
                <div className="text-xs opacity-70">{c.tagline}</div>
              </div>
              {c.online && (
                <span className="ml-auto text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                  Online
                </span>
              )}
            </div>
            
            <div className="mt-3 text-xs opacity-70">
              {c.languages?.join(" • ")}
              {c.specialties?.length ? ` • ${c.specialties.join(", ")}` : ""}
            </div>
            
            <div className="mt-4 flex gap-2">
              <Link 
                href={`/curator/${c.slug}`} 
                className="px-3 py-1.5 rounded-lg border hover:bg-neutral-50 text-sm"
              >
                View profile
              </Link>
              <Link 
                href={`/curator/${c.slug}?ask=1`} 
                className="px-3 py-1.5 rounded-lg bg-black text-white text-sm"
              >
                Ask this curator
              </Link>
            </div>
          </article>
        ))}
      </div>
      
      <div className="mt-8 text-sm">
        Or <Link href="/artist/explore" className="underline">start with artworks</Link> and ask a curator later.
      </div>
    </div>
  );
}
