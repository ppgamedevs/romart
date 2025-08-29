import type { MetadataRoute } from "next";

async function fetchSlugs() {
  const api = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const [arts, artists, cols] = await Promise.all([
    fetch(`${api}/public/slugs/artworks`).then(r => r.json()).catch(() => []),
    fetch(`${api}/public/slugs/artists`).then(r => r.json()).catch(() => []),
    fetch(`${api}/public/slugs/collections`).then(r => r.json()).catch(() => [])
  ]);
  return { arts, artists, cols };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL || "http://localhost:3000";
  const locales = (process.env.LOCALES || "en,ro").split(",");
  const def = process.env.DEFAULT_LOCALE || "en";
  const { arts, artists, cols } = await fetchSlugs();

  const entries: MetadataRoute.Sitemap = [];

  function pushPath(path: string, lastmod?: string) {
    const urlDef = `${base}/${def}${path}`;
    const alternates = locales.reduce<Record<string, string>>((acc, l) => {
      acc[l] = `${base}/${l}${path}`;
      return acc;
    }, {});
    entries.push({ 
      url: urlDef, 
      lastModified: lastmod ? new Date(lastmod) : undefined, 
      alternates: { languages: alternates } as any 
    });
  }

  // Static
  ["/", "/discover", "/sign-in", "/sign-up"].forEach(p => pushPath(p));

  // Dynamic
  for (const s of arts || []) pushPath(`/artwork/${s.slug}`, s.updatedAt);
  for (const s of artists || []) pushPath(`/artist/${s.slug}`, s.updatedAt);
  for (const s of cols || []) pushPath(`/collection/${s.slug}`, s.updatedAt);

  return entries;
}
