import { MetadataRoute } from "next";
import { prisma } from "@artfromromania/db";

export const revalidate = 86400; // 1 day

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://artfromromania.com";

  // Get published artists
  const artists = await prisma.artist.findMany({
    where: {
      kycStatus: "APPROVED",
      banned: false,
      shadowbanned: false
    },
    select: {
      slug: true,
      updatedAt: true
    }
  });

  // Get published artworks
  const artworks = await prisma.artwork.findMany({
    where: {
      status: "PUBLISHED",
      visibility: "PUBLIC",
      suppressed: false,
      moderationStatus: "APPROVED"
    },
    select: {
      slug: true,
      updatedAt: true
    }
  });

  const items: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1
    },
    {
      url: `${baseUrl}/discover`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9
    },
    ...artists.map(artist => ({
      url: `${baseUrl}/artist/${artist.slug}`,
      lastModified: artist.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8
    })),
    ...artworks.map(artwork => ({
      url: `${baseUrl}/artwork/${artwork.slug}`,
      lastModified: artwork.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7
    }))
  ];

  return items;
}
