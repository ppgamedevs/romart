import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

async function fetchCollection(slug: string) {
  const r = await fetch(`/api/public/collection/${slug}`, { cache: "no-store" });
  if (!r.ok) return null; 
  return r.json();
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const c = await fetchCollection(params.slug);
  if (!c) return { title: "Collection not found — Art from Romania" };
  const title = `${c.title} — Collection`;
  return { 
    title, 
    description: c.subtitle || c.description || "Curated selection", 
    openGraph: { title, description: c.subtitle || "" } 
  };
}

export default async function CollectionPage({ params }: { params: { slug: string } }) {
  const c = await fetchCollection(params.slug);
  if (!c) return <div className="p-6">Collection not found</div>;
  
  return (
    <div className="pb-10">
      <section className={(c.heroTone === "LIGHT" ? "bg-white text-black" : "bg-black text-white") + " relative"}>
        <div className="absolute inset-0">
          {c.coverImageUrl && <Image src={c.coverImageUrl} alt="" fill className="object-cover opacity-40" />}
        </div>
        <div className="relative max-w-6xl mx-auto p-10">
          <h1 className="text-4xl font-semibold">{c.title}</h1>
          {c.subtitle && <p className="mt-2 opacity-80 text-lg">{c.subtitle}</p>}
          {c.curator && (
            <div className="mt-3 text-sm opacity-80">
              Curated by <Link className="underline" href={`/curator/${c.curator.slug}`}>{c.curator.displayName}</Link>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-6xl mx-auto p-6 grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        {c.artworks.map((a: any) => (
          <Link key={a.id} href={`/artwork/${a.slug}`} className="block rounded-2xl overflow-hidden border bg-white">
            <div className="relative h-60 bg-neutral-100">
              {a.images?.[0]?.url && <Image src={a.images[0].url} alt={a.title} fill className="object-cover" />}
            </div>
            <div className="p-3">
              <div className="text-sm font-medium line-clamp-1">{a.title}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
