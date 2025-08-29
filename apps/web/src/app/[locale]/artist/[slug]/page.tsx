import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/seo/JsonLd";
import ArtistHeader from "@/components/domain/artist/ArtistHeader";
import ExhibitionsTimeline from "@/components/domain/artist/ExhibitionsTimeline";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

async function fetchArtist(slug: string) {
  const api = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const r = await fetch(`${api}/public/artist/by-slug/${slug}`, { cache: "no-store" });
  if (!r.ok) return null;
  return r.json();
}

async function fetchArtistWorks(artistId: string) {
  const api = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const r = await fetch(`${api}/public/artist/${artistId}/works`, { cache: "no-store" });
  if (!r.ok) return [];
  return r.json();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  
  const data = await fetchArtist(slug);
  if (!data) {
    return {
      title: "Artist Not Found",
    };
  }

  const artist = data.artist;
  const base = process.env.SITE_URL || "http://localhost:3000";
  
  return {
    title: `${artist.displayName} — Artist`,
    description: artist.bio?.slice(0, 160) || `${artist.displayName} - Romanian artist on Art from Romania`,
    alternates: { 
      canonical: `${base}/${locale}/artist/${artist.slug}`,
      languages: {
        en: `${base}/en/artist/${artist.slug}`,
        ro: `${base}/ro/artist/${artist.slug}`
      }
    },
    openGraph: {
      title: artist.displayName,
      description: artist.bio || `${artist.displayName} - Romanian artist on Art from Romania`,
      url: `${base}/${locale}/artist/${artist.slug}`,
      type: "profile",
      images: artist.avatarUrl ? [artist.avatarUrl] : undefined,
    },
  };
}

export default async function ArtistPage({ params }: PageProps) {
  const { locale, slug } = await params;
  
  const data = await fetchArtist(slug);
  if (!data) {
    notFound();
  }

  const works = await fetchArtistWorks(data.artist.id);

  const jsonld = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": data.artist.displayName,
    "image": data.artist.avatarUrl || undefined,
    "url": `${process.env.SITE_URL || "http://localhost:3000"}/${locale}/artist/${data.artist.slug}`,
    "award": data.artist.verifiedAt ? ["Verified Artist — Art from Romania"] : undefined,
    "performerIn": (data.artist.exhibitions || []).slice(0, 8).map((e: any) => ({
      "@type": "Event",
      "name": `${e.type === "SOLO" ? "Solo" : "Group"} — ${e.title}`,
      "startDate": e.startDate || undefined,
      "location": [e.venue, e.city, e.country].filter(Boolean).join(", ") || undefined,
      "url": e.url || undefined
    }))
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <JsonLd data={jsonld} />
      
      <ArtistHeader artist={{ ...data.artist, kpi: data.kpi }} locale={locale} />
      
      {/* Tabs simple: Works + About (bio) + Exhibitions */}
      <div className="mt-8 grid md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          <h2 className="text-xl font-semibold">Works</h2>
          <div className="mt-4">
            <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))" }}>
              {works.map((a: any) => (
                <a
                  key={a.id}
                  href={`/${locale}/artwork/${a.slug}`}
                  className="block rounded-2xl overflow-hidden border bg-card hover:shadow-soft relative"
                >
                  {a.soldOut && (
                    <span className="absolute left-2 top-2 text-[11px] px-2 py-0.5 rounded-full bg-neutral-900/90 text-white">
                      SOLD
                    </span>
                  )}
                  <div className="relative h-60 bg-neutral-100">
                    {/* thumb endpoint existent */}
                    <img src={`/api/artwork/${a.id}/thumb`} alt={a.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3">
                    <div className="text-sm font-medium line-clamp-1">{a.title}</div>
                    <div className="text-xs opacity-70 line-clamp-1">{data.artist.displayName}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
        <aside className="md:col-span-1">
          {data.artist.bio && (
            <section className="rounded-2xl border p-4">
              <h3 className="font-medium">About</h3>
              <p className="mt-2 text-sm opacity-80 whitespace-pre-line">{data.artist.bio}</p>
            </section>
          )}
          <ExhibitionsTimeline items={data.artist.exhibitions} />
        </aside>
      </div>
    </div>
  );
}
