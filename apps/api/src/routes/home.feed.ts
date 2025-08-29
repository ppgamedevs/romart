import { FastifyInstance } from "fastify";
import { prisma } from "@artfromromania/db";

export default async function routes(app: FastifyInstance) {
  app.get("/public/home-feed", async (_req, res) => {
    const days = parseInt(process.env.HOME_TRENDING_WINDOW_DAYS || "30", 10);
    const since = new Date(Date.now() - days * 864e5);

    const [collections, trending, newest, underPrice] = await Promise.all([
      prisma.collection.findMany({
        where: { publishedAt: { not: null } },
        orderBy: [
          { isFeatured: "desc" },
          { sortIndex: "asc" },
          { updatedAt: "desc" }
        ],
        take: parseInt(process.env.HOME_COLLECTIONS_LIMIT || "8", 10),
        select: {
          slug: true,
          title: true,
          subtitle: true,
          coverImageUrl: true
        }
      }),
      prisma.searchItem.findMany({
        where: { publishedAt: { not: null } },
        orderBy: [
          { purchases90: "desc" },
          { saves30: "desc" },
          { views30: "desc" }
        ],
        take: parseInt(process.env.HOME_TRENDING_LIMIT || "18", 10),
        select: {
          id: true,
          slug: true,
          title: true,
          artistName: true,
          orientation: true,
          priceMinor: true,
          minPriceMinor: true
        }
      }),
      prisma.searchItem.findMany({
        where: { publishedAt: { gte: since } },
        orderBy: [{ publishedAt: "desc" }],
        take: parseInt(process.env.HOME_NEW_LIMIT || "24", 10),
        select: {
          id: true,
          slug: true,
          title: true,
          artistName: true,
          priceMinor: true,
          minPriceMinor: true
        }
      }),
      prisma.searchItem.findMany({
        where: {
          publishedAt: { not: null },
          OR: [
            {
              minPriceMinor: {
                lte: parseInt(process.env.HOME_UNDER_PRICE_MINOR || "50000", 10)
              }
            },
            {
              priceMinor: {
                lte: parseInt(process.env.HOME_UNDER_PRICE_MINOR || "50000", 10)
              }
            }
          ]
        },
        orderBy: [
          { minPriceMinor: "asc" },
          { priceMinor: "asc" }
        ],
        take: parseInt(process.env.HOME_UNDER_LIMIT || "18", 10),
        select: {
          id: true,
          slug: true,
          title: true,
          artistName: true,
          priceMinor: true,
          minPriceMinor: true
        }
      })
    ]);

    res.send({ collections, trending, newest, underPrice });
  });
}
