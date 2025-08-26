import type { MetadataRoute } from "next";

type Row = { slug: string; updatedAt: string };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL || "http://localhost:3000";
  const api = process.env.API_URL || "http://localhost:3001";
  
  try {
    const res = await fetch(`${api}/seo/sitemap`, { next: { revalidate: 3600 } });
    if (!res.ok) {
      return [
        { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
        { url: `${base}/discover`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
      ];
    }
    
    const data = await res.json() as { artists: Row[]; artworks: Row[] };
    const now = new Date();

    const home: MetadataRoute.Sitemap = [
      { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
      { url: `${base}/discover`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    ];

    const artists = (data.artists || []).map(r => ({
      url: `${base}/artist/${r.slug}`,
      lastModified: new Date(r.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    const artworks = (data.artworks || []).map(r => ({
      url: `${base}/artwork/${r.slug}`,
      lastModified: new Date(r.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    return [...home, ...artists, ...artworks];
  } catch (error) {
    // Fallback sitemap if API is unavailable
    return [
      { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
      { url: `${base}/discover`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    ];
  }
}
