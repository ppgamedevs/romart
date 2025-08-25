import { FastifyInstance } from "fastify";
import { z } from "zod";
// Use fastify-decorated prisma instance
import { createRateLimiter } from "../utils/rateLimiter";

const CreateFavoriteSchema = z.object({
  artworkId: z.string(),
});

export async function favoriteRoutes(fastify: FastifyInstance) {
  // Rate limiter for favorites
  const favoriteRateLimiter = createRateLimiter("favorites", 10, 60); // 10 requests per minute
  const { prisma } = fastify;

  // POST /favorites - Create a favorite
  fastify.post("/favorites", {
    preHandler: [favoriteRateLimiter],
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
    const { artworkId } = request.body as z.infer<typeof CreateFavoriteSchema>;
    const user = request.user;

    if (!user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    try {
      // Check if artwork exists
      const artwork = await prisma.artwork.findUnique({
        where: { id: artworkId },
        select: { id: true, status: true, visibility: true }
      });

      if (!artwork) {
        return reply.status(404).send({ error: "Artwork not found" });
      }

      if (artwork.status !== "PUBLISHED" || artwork.visibility !== "PUBLIC") {
        return reply.status(404).send({ error: "Artwork not available" });
      }

      // Create favorite (idempotent due to unique constraint)
      const favorite = await prisma.favorite.upsert({
        where: {
          userId_artworkId: {
            userId: user.id,
            artworkId,
          },
        },
        update: {},
        create: {
          userId: user.id,
          artworkId,
        },
      });

      // Update artwork stats
      await prisma.artworkStat.upsert({
        where: { artworkId },
        update: {
          favoritesCount: {
            increment: 1,
          },
        },
        create: {
          artworkId,
          favoritesCount: 1,
        },
      });

      return reply.send({ success: true, favorite });
    } catch (error) {
      console.error("Error creating favorite:", error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  // DELETE /favorites/:artworkId - Remove a favorite
  fastify.delete("/favorites/:artworkId", {
    preHandler: [favoriteRateLimiter],
  }, async (request, reply) => {
    const { artworkId } = request.params as { artworkId: string };
    const user = request.user;

    if (!user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    try {
      // Delete favorite
      const deleted = await prisma.favorite.deleteMany({
        where: {
          userId: user.id,
          artworkId,
        },
      });

      if (deleted.count === 0) {
        return reply.status(404).send({ error: "Favorite not found" });
      }

      // Update artwork stats
      await prisma.artworkStat.updateMany({
        where: { artworkId },
        data: {
          favoritesCount: {
            decrement: 1,
          },
        },
      });

      return reply.send({ success: true });
    } catch (error) {
      console.error("Error deleting favorite:", error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  // GET /me/favorites - Get user's favorites
  fastify.get("/me/favorites", {
    preHandler: [],
  }, async (request, reply) => {
    const user = request.user;

    if (!user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    try {
      const favorites = await prisma.favorite.findMany({
        where: {
          userId: user.id,
        },
        include: {
          artwork: {
            select: {
              id: true,
              title: true,
              heroImageUrl: true,
              priceAmount: true,
              priceCurrency: true,
              artist: {
                select: {
                  id: true,
                  displayName: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return reply.send({ favorites });
    } catch (error) {
      console.error("Error fetching favorites:", error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });
}
