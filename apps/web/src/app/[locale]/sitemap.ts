import { MetadataRoute } from "next";
import { prisma } from "@artfromromania/db";

export const revalidate = 86400; // 1 day

export default async function sitemap({ params }: { params: Promise<{ locale: string }> }): Promise<MetadataRoute.Sitemap> {
  const { locale } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://artfromromania.com";

  // Get published artists for this locale
  const artists = await prisma.artist.findMany({
    where: {
      kycStatus: "APPROVED",
      banned: false,
      shadowbanned: false,
    },
    select: {
      slug: true,
      slugEn: true,
      slugRo: true,
      updatedAt: true
    }
  });

  // Get published artworks for this locale
  const artworks = await prisma.artwork.findMany({
    where: {
      status: "PUBLISHED",
      visibility: "PUBLIC",
      suppressed: false,
      moderationStatus: "APPROVED",
    },
    select: {
      slug: true,
      slugEn: true,
      slugRo: true,
      updatedAt: true
    }
  });

  const items: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1
    },
    {
      url: `${baseUrl}/${locale}/discover`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9
    },
  ];

  // Add artists with locale-specific slugs
  artists.forEach(artist => {
    const slug = locale === "ro" ? artist.slugRo : artist.slugEn;
    if (slug) {
      items.push({
        url: `${baseUrl}/${locale}/artist/${slug}`,
        lastModified: artist.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8
      });
    }
  });

  // Add artworks with locale-specific slugs
  artworks.forEach(artwork => {
    const slug = locale === "ro" ? artwork.slugRo : artwork.slugEn;
    if (slug) {
      items.push({
        url: `${baseUrl}/${locale}/artwork/${slug}`,
        lastModified: artwork.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7
      });
    }
  });

  return items;
}
