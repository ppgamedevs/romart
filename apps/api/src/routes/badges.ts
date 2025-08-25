import { FastifyInstance } from "fastify";
import { z } from "zod";
// Use fastify-decorated prisma instance
import { CuratorBadgeKind } from "@artfromromania/db";

const CreateBadgeSchema = z.object({
  artworkId: z.string(),
  kind: z.nativeEnum(CuratorBadgeKind),
  notes: z.string().optional(),
  expiresAt: z.string().optional(), // ISO date string
});

const UpdateBadgeSchema = z.object({
  notes: z.string().optional(),
  expiresAt: z.string().optional(),
});

// Auto-badge functions (called from other parts of the system)
export async function autoAssignBadges(artworkId: string, prisma: any) {
  try {
    const artwork = await prisma.artwork.findUnique({
      where: { id: artworkId },
      include: {
        stats: true,
        editions: true,
      },
    });

    if (!artwork) return;

    const badges = [];

    // NEW_ARRIVAL - if published less than 14 days ago
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    if (artwork.publishedAt && artwork.publishedAt > fourteenDaysAgo) {
      badges.push({
        kind: CuratorBadgeKind.NEW_ARRIVAL,
        artworkId,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      });
    }

    // TRENDING - if views24h >= threshold
    const trendingThreshold = parseInt(process.env.SOCIALPROOF_TRENDING_24H_VIEWS || "50");

    if (artwork.stats?.views24h && artwork.stats.views24h >= trendingThreshold) {
      badges.push({
        kind: CuratorBadgeKind.TRENDING,
        artworkId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });
    }

    // LIMITED_LEFT - if any edition has low stock
    const lowStockThreshold = parseInt(process.env.SOCIALPROOF_EDITION_LOW_STOCK || "3");
    const hasLowStock = artwork.editions.some((edition: any) =>
      edition.available && edition.available > 0 && edition.available <= lowStockThreshold
    );

    if (hasLowStock) {
      badges.push({
        kind: CuratorBadgeKind.LIMITED_LEFT,
        artworkId,
      });
    }

    // EDITION_SOLD_OUT - if any edition is sold out
    const hasSoldOut = artwork.editions.some((edition: any) => edition.available === 0);
    if (hasSoldOut) {
      badges.push({
        kind: CuratorBadgeKind.EDITION_SOLD_OUT,
        artworkId,
      });
    }

    // SHIPS_FROM_RO - for all original artworks (or based on origin)
    if (artwork.kind === "ORIGINAL") {
      badges.push({
        kind: CuratorBadgeKind.SHIPS_FROM_RO,
        artworkId,
      });
    }

          // Create badges (avoid duplicates)
      for (const badge of badges) {
        // Check if badge already exists
        const existing = await prisma.curatorBadge.findFirst({
          where: {
            artworkId: badge.artworkId,
            kind: badge.kind,
          },
        });

        if (existing) {
          // Update existing badge
          await prisma.curatorBadge.update({
            where: { id: existing.id },
            data: {
              expiresAt: badge.expiresAt,
            },
          });
        } else {
          // Create new badge
          await prisma.curatorBadge.create({
            data: badge,
          });
        }
      }
  } catch (error) {
    console.error("Error auto-assigning badges:", error);
  }
}

export async function badgeRoutes(fastify: FastifyInstance) {
  const { prisma } = fastify;
  // POST /admin/badges - Create a curator badge
  fastify.post("/admin/badges", {
    preHandler: [],
    schema: {
      body: {
        type: "object",
        properties: {
          artworkId: { type: "string" },
          kind: { type: "string", enum: ["NEW_ARRIVAL", "TRENDING", "LIMITED_LEFT", "EDITION_SOLD_OUT", "SHIPS_FROM_RO", "CURATOR_PICK", "FEATURED"] },
          notes: { type: "string" },
          expiresAt: { type: "string", format: "date-time" }
        },
        required: ["artworkId", "kind"]
      },
    },
  }, async (request, reply) => {
    const { artworkId, kind, notes, expiresAt } = request.body as z.infer<typeof CreateBadgeSchema>; 
    const user = request.user;

    if (!user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    // Check if user is admin or curator
    if (user.role !== "ADMIN" && user.role !== "CURATOR") {
      return reply.status(403).send({ error: "Forbidden" });
    }

    try {
      // Check if artwork exists
      const artwork = await prisma.artwork.findUnique({
        where: { id: artworkId },
        select: { id: true, status: true }
      });

      if (!artwork) {
        return reply.status(404).send({ error: "Artwork not found" });
      }

      // Create badge
      const badge = await prisma.curatorBadge.create({
        data: {
          artworkId,
          kind,
          notes,
          curatorId: user.id,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
      });

      return reply.send({ success: true, badge });
    } catch (error) {
      console.error("Error creating badge:", error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  // DELETE /admin/badges/:id - Delete a curator badge
  fastify.delete("/admin/badges/:id", {
    preHandler: [],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user;

    if (!user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    // Check if user is admin or curator
    if (user.role !== "ADMIN" && user.role !== "CURATOR") {
      return reply.status(403).send({ error: "Forbidden" });
    }

    try {
      const deleted = await prisma.curatorBadge.deleteMany({
        where: { id },
      });

      if (deleted.count === 0) {
        return reply.status(404).send({ error: "Badge not found" });
      }

      return reply.send({ success: true });
    } catch (error) {
      console.error("Error deleting badge:", error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  // GET /admin/badges - List badges (admin/curator only)
  fastify.get("/admin/badges", {
    preHandler: [],
  }, async (request, reply) => {
    const user = request.user;
    const { artworkId, kind } = request.query as { artworkId?: string; kind?: string };

    if (!user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    // Check if user is admin or curator
    if (user.role !== "ADMIN" && user.role !== "CURATOR") {
      return reply.status(403).send({ error: "Forbidden" });
    }

    try {
      const where: any = {};

      if (artworkId) {
        where.artworkId = artworkId;
      }

      if (kind) {
        where.kind = kind as CuratorBadgeKind;
      }

      const badges = await prisma.curatorBadge.findMany({
        where,
        include: {
          artwork: {
            select: {
              id: true,
              title: true,
              artist: {
                select: {
                  id: true,
                  displayName: true,
                },
              },
            },
          },
          curator: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return reply.send({ badges });
    } catch (error) {
      console.error("Error fetching badges:", error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  // POST /admin/jobs/expire-badges - Expire expired badges (cron job)
  fastify.post("/admin/jobs/expire-badges", {
    preHandler: [],
  }, async (request, reply) => {
    const user = request.user;

    if (!user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    // Check if user is admin
    if (user.role !== "ADMIN") {
      return reply.status(403).send({ error: "Forbidden" });
    }

    try {
      // Delete expired badges
      const deleted = await prisma.curatorBadge.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      return reply.send({
        success: true,
        deletedCount: deleted.count
      });
    } catch (error) {
      console.error("Error expiring badges:", error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });
}
