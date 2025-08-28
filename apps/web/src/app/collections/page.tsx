import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Curated Collections — Art from Romania",
  description: "Editorial picks by our curators.",
  openGraph: { title: "Curated Collections — Art from Romania" },
};

async function fetchCollections() {
  const r = await fetch("/api/public/collections", { cache: "no-store" });
  if (!r.ok) return { items: [] };
  return r.json();
}

export default async function CollectionsPage() {
  const { items } = await fetchCollections();
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-semibold">Curated Collections</h1>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
        {items.map((c: any) => (
          <Link key={c.slug} href={`/collection/${c.slug}`} className="block rounded-2xl overflow-hidden border bg-white">
            <div className="relative h-48 bg-neutral-100">
              {c.coverImageUrl && <Image src={c.coverImageUrl} alt={c.title} fill className="object-cover" />}
              {c.isFeatured && <span className="absolute top-2 left-2 text-[11px] px-2 py-1 rounded-full bg-black text-white">Featured</span>}
            </div>
            <div className="p-3">
              <div className="font-medium">{c.title}</div>
              {c.subtitle && <div className="text-sm opacity-70 line-clamp-1">{c.subtitle}</div>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
