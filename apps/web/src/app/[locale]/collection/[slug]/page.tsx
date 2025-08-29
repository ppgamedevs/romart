import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { altLanguages, canonicalUrl } from "@/lib/seo";

async function fetchCollection(slug: string) {
  const api = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const r = await fetch(`${api}/public/collection/${slug}`, { cache: "no-store" });
  if (!r.ok) return null;
  return r.json();
}

export async function generateMetadata({ params }: { params: { locale: string; slug: string } }): Promise<Metadata> {
  const col = await fetchCollection(params.slug);
  if (!col) return { title: "Collection not found — Art from Romania" };
  
  const title = `${col.title} — Collection`;
  const path = `/collection/${params.slug}`;
  
  return {
    title,
    description: col.subtitle || col.description || "Curated collection",
    alternates: { 
      canonical: canonicalUrl(path), 
      languages: altLanguages(path) 
    },
    openGraph: { 
      title, 
      description: col.subtitle || "" 
    }
  };
}

export default async function CollectionPage({ params }: { params: { locale: string; slug: string } }) {
  const col = await fetchCollection(params.slug);
  if (!col) return <div className="p-6">Collection not found</div>;

  const jsonld = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": col.title,
    "url": canonicalUrl(`/collection/${col.slug}`),
    "image": col.coverImageUrl || undefined,
    "about": col.subtitle || undefined
  };

  return (
    <div className="pb-10">
      <JsonLd data={jsonld} />
      <section className={(col.heroTone === "LIGHT" ? "bg-white text-black" : "bg-black text-white") + " relative"}>
        <div className="absolute inset-0">
          {col.coverImageUrl && <Image src={col.coverImageUrl} alt="" fill className="object-cover opacity-40" />}
        </div>
        <div className="relative max-w-6xl mx-auto p-10">
          <h1 className="text-4xl font-semibold">{col.title}</h1>
          {col.subtitle && <p className="mt-2 opacity-80 text-lg">{col.subtitle}</p>}
          {col.curator && (
            <div className="mt-3 text-sm opacity-80">
              Curated by <Link className="underline" href={`/${params.locale}/curator/${col.curator.slug}`}>{col.curator.displayName}</Link>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-6xl mx-auto p-6 grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        {col.artworks.map((a: any) => (
          <Link key={a.id} href={`/${params.locale}/artwork/${a.slug}`} className="block rounded-2xl overflow-hidden border bg-white">
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
