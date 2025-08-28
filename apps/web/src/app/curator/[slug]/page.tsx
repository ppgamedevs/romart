import Image from "next/image";
import Link from "next/link";

export const dynamic = 'force-dynamic';

async function fetchCurator(slug: string) {
  const api = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const r = await fetch(`${api}/public/curator/${slug}`, { cache: "no-store" });
  if (!r.ok) return null;
  return r.json();
}

export default async function CuratorProfilePage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ slug: string }>, 
  searchParams: Promise<{ ask?: string }> 
}) {
  const { slug } = await params;
  const searchParamsResolved = await searchParams;
  const c = await fetchCurator(slug);
  if (!c) return <div className="p-6">Curator not found</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-center gap-6">
        <div className="relative w-24 h-24 rounded-full overflow-hidden bg-neutral-100">
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
          <h1 className="text-3xl font-semibold">{c.displayName}</h1>
          <p className="opacity-70">{c.tagline}</p>
          <div className="text-xs opacity-70 mt-1">
            {c.languages?.join(" • ")}
            {c.specialties?.length ? ` • ${c.specialties.join(", ")}` : ""}
          </div>
          {c.online && (
            <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
              Online
            </span>
          )}
        </div>
      </header>

      {c.bio && (
        <article className="prose max-w-none">
          {c.bio}
        </article>
      )}

      <div className="flex gap-3">
        <Link 
          href={`/artist/discover`} 
          className="px-3 py-1.5 rounded-lg border text-sm"
        >
          Discover art
        </Link>
        <Link 
          href={`/artist/${encodeURIComponent("")}/contact?curator=${slug}`} 
          className="px-3 py-1.5 rounded-lg bg-black text-white text-sm"
        >
          Ask {c.displayName}
        </Link>
      </div>
    </div>
  );
}
