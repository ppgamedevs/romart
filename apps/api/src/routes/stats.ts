import { FastifyInstance } from "fastify";
import { z } from "zod";
// Use fastify-decorated prisma instance
import { createRateLimiter } from "../utils/rateLimiter";

const ViewStatsSchema = z.object({
  artworkId: z.string(),
});

const SocialProofSchema = z.object({
  artworkId: z.string(),
});

export async function statsRoutes(fastify: FastifyInstance) {
  // Rate limiter for stats
  const statsRateLimiter = createRateLimiter("stats", 30, 60); // 30 requests per minute
  const { prisma } = fastify;

  // POST /stats/view - Record a view
  fastify.post("/stats/view", {
    preHandler: [statsRateLimiter],
    schema: {
      body: {
        type: "object",
        properties: {
          artworkId: { type: "string" }
        },
        required: ["artworkId"]
      },
    },
  }, async (request, reply) => {
    const { artworkId } = request.body as z.infer<typeof ViewStatsSchema>;

    try {
      // Check if artwork exists and is published
      const artwork = await prisma.artwork.findUnique({
        where: { id: artworkId },
        select: { id: true, status: true, visibility: true }
      });

      if (!artwork || artwork.status !== "PUBLISHED" || artwork.visibility !== "PUBLIC") {
        return reply.status(404).send({ error: "Artwork not found" });
      }

      // Update artwork stats
      await prisma.artworkStat.upsert({
        where: { artworkId },
        update: {
          views24h: {
            increment: 1,
          },
          views7d: {
            increment: 1,
          },
        },
        create: {
          artworkId,
          views24h: 1,
          views7d: 1,
        },
      });

      return reply.send({ success: true });
    } catch (error) {
      console.error("Error recording view:", error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  // GET /artworks/:artworkId/social-proof - Get social proof data
  fastify.get("/artworks/:artworkId/social-proof", {
    preHandler: [statsRateLimiter],
  }, async (request, reply) => {
    const { artworkId } = request.params as { artworkId: string };

    try {
      // Get artwork with stats and badges
      const artwork = await prisma.artwork.findUnique({
        where: { id: artworkId },
        include: {
          stats: true,
          badges: {
            where: {
              OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } },
              ],
            },
            orderBy: {
              kind: "asc",
            },
          },
          editions: true,
        },
      });

      if (!artwork) {
        return reply.status(404).send({ error: "Artwork not found" });
      }

      // Get environment variables for thresholds
      const minFavorites = parseInt(process.env.SOCIALPROOF_MIN_FAVORITES || "5");
      const min24hViews = parseInt(process.env.SOCIALPROOF_MIN_24H_VIEWS || "10");

      // Prepare social proof data
      const socialProof = {
                favoritesCount: artwork.stats?.favoritesCount && artwork.stats.favoritesCount >= minFavorites
          ? artwork.stats.favoritesCount
          : null,
                views24h: artwork.stats?.views24h && artwork.stats.views24h >= min24hViews
          ? artwork.stats.views24h
          : null,
        soldCount: artwork.stats?.soldCount || 0,
        countriesCount: artwork.stats?.countriesCount || 0,
        badges: artwork.badges.map(badge => ({
          kind: badge.kind,
          notes: badge.notes,
        })),
        scarcity: {
          editions: artwork.editions.map(edition => ({
            id: edition.id,
            sizeName: edition.sizeName,
            total: edition.runSize,
            available: edition.available,
            isLowStock: edition.available && edition.available <= parseInt(process.env.SOCIALPROOF_EDITION_LOW_STOCK || "3"),
            isSoldOut: edition.available === 0,
          })),
        },
      };

      // Set cache headers
      reply.header("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");

      return reply.send(socialProof);
    } catch (error) {
      console.error("Error fetching social proof:", error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  // GET /artists/:artistId/social-proof - Get artist social proof data
  fastify.get("/artists/:artistId/social-proof", {
    preHandler: [statsRateLimiter],
  }, async (request, reply) => {
    const { artistId } = request.params as { artistId: string };

    try {
      // Get artist with stats and aggregated artwork data
      const artist = await prisma.artist.findUnique({
        where: { id: artistId },
        include: {
          stats: true,
          artworks: {
            where: {
              status: "PUBLISHED",
              visibility: "PUBLIC",
            },
            include: {
              stats: true,
            },
          },
        },
      });

      if (!artist) {
        return reply.status(404).send({ error: "Artist not found" });
      }

      // Calculate aggregated stats
      const totalFavorites = artist.artworks.reduce((sum, artwork) => 
        sum + (artwork.stats?.favoritesCount || 0), 0
      );

      const socialProof = {
        soldCountries: artist.stats?.soldCountries || 0,
        totalSold: artist.stats?.totalSold || 0,
        totalFavorites,
        followersCount: artist.stats?.followersCount || 0,
      };

      // Set cache headers
      reply.header("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");

      return reply.send(socialProof);
    } catch (error) {
      console.error("Error fetching artist social proof:", error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });
}
