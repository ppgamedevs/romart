import { FastifyInstance } from "fastify";
import { prisma } from "@artfromromania/db";
import { 
  approveModerationItem,
  markMatureModerationItem,
  rejectModerationItem,
  banArtist,
  unbanArtist,
  shadowbanArtist,
  unshadowbanArtist,
  logAudit
} from "../moderation/service";
import { 
  MODERATION_ACTIONS,
  AUDIT_ACTIONS,
  ENTITY_TYPES,
  REPORT_CATEGORIES
} from "@artfromromania/shared";

export async function moderationRoutes(fastify: FastifyInstance) {
  // Get moderation queue
  fastify.get("/admin/moderation", async (request, reply) => {
    try {
      const query = request.query as any;
      const status = query.status || "PENDING";
      const entityType = query.entityType;
      const cursor = query.cursor;
      const limit = parseInt(query.limit) || 20;

      const where: any = { status };
      if (entityType) {
        where.entityType = entityType;
      }

      const items = await prisma.moderationItem.findMany({
        where,
        include: {
          actions: {
            orderBy: { createdAt: "desc" },
            take: 1
          }
        },
        orderBy: { createdAt: "asc" },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined
      });

      const hasMore = items.length > limit;
      const nextCursor = hasMore ? items[limit - 1].id : null;
      const results = hasMore ? items.slice(0, limit) : items;

      // Get entity details for each item
      const itemsWithDetails = await Promise.all(
        results.map(async (item) => {
          let entity = null;
          
          if (item.entityType === ENTITY_TYPES.ARTWORK) {
            entity = await prisma.artwork.findUnique({
              where: { id: item.entityId },
              include: {
                artist: {
                  select: {
                    id: true,
                    displayName: true,
                    slug: true
                  }
                },
                images: {
                  orderBy: { position: "asc" },
                  take: 1
                }
              }
            });
          } else if (item.entityType === ENTITY_TYPES.ARTIST) {
            entity = await prisma.artist.findUnique({
              where: { id: item.entityId },
              select: {
                id: true,
                displayName: true,
                slug: true,
                avatarUrl: true
              }
            });
          }

          return {
            ...item,
            entity
          };
        })
      );

      return {
        items: itemsWithDetails,
        nextCursor,
        hasMore
      };
    } catch (error) {
      console.error("Failed to get moderation queue:", error);
      return reply.status(500).send({ 
        error: "Failed to get moderation queue",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Approve moderation item
  fastify.post("/admin/moderation/:id/approve", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { notes } = request.body as { notes?: string };
      const actorId = (request as any).user?.id;

      if (!actorId) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      await approveModerationItem(id, actorId, notes);

      return { success: true };
    } catch (error) {
      console.error("Failed to approve moderation item:", error);
      return reply.status(500).send({ 
        error: "Failed to approve moderation item",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Mark content as mature
  fastify.post("/admin/moderation/:id/mark-mature", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { notes } = request.body as { notes?: string };
      const actorId = (request as any).user?.id;

      if (!actorId) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      await markMatureModerationItem(id, actorId, notes);

      return { success: true };
    } catch (error) {
      console.error("Failed to mark content as mature:", error);
      return reply.status(500).send({ 
        error: "Failed to mark content as mature",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Reject moderation item
  fastify.post("/admin/moderation/:id/reject", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { notes } = request.body as { notes?: string };
      const actorId = (request as any).user?.id;

      if (!actorId) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      await rejectModerationItem(id, actorId, notes);

      return { success: true };
    } catch (error) {
      console.error("Failed to reject moderation item:", error);
      return reply.status(500).send({ 
        error: "Failed to reject moderation item",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Ban artist
  fastify.post("/admin/artist/:id/ban", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { reason } = request.body as { reason: string };
      const actorId = (request as any).user?.id;

      if (!actorId) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      if (!reason) {
        return reply.status(400).send({ error: "Reason is required" });
      }

      await banArtist(id, actorId, reason);

      return { success: true };
    } catch (error) {
      console.error("Failed to ban artist:", error);
      return reply.status(500).send({ 
        error: "Failed to ban artist",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Unban artist
  fastify.post("/admin/artist/:id/unban", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { notes } = request.body as { notes?: string };
      const actorId = (request as any).user?.id;

      if (!actorId) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      await unbanArtist(id, actorId, notes);

      return { success: true };
    } catch (error) {
      console.error("Failed to unban artist:", error);
      return reply.status(500).send({ 
        error: "Failed to unban artist",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Shadowban artist
  fastify.post("/admin/artist/:id/shadowban", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { notes } = request.body as { notes?: string };
      const actorId = (request as any).user?.id;

      if (!actorId) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      await shadowbanArtist(id, actorId, notes);

      return { success: true };
    } catch (error) {
      console.error("Failed to shadowban artist:", error);
      return reply.status(500).send({ 
        error: "Failed to shadowban artist",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Unshadowban artist
  fastify.post("/admin/artist/:id/unshadowban", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { notes } = request.body as { notes?: string };
      const actorId = (request as any).user?.id;

      if (!actorId) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      await unshadowbanArtist(id, actorId, notes);

      return { success: true };
    } catch (error) {
      console.error("Failed to unshadowban artist:", error);
      return reply.status(500).send({ 
        error: "Failed to unshadowban artist",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get reports
  fastify.get("/admin/reports", async (request, reply) => {
    try {
      const query = request.query as any;
      const status = query.status || "OPEN";
      const cursor = query.cursor;
      const limit = parseInt(query.limit) || 20;

      const reports = await prisma.report.findMany({
        where: { status },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined
      });

      const hasMore = reports.length > limit;
      const nextCursor = hasMore ? reports[limit - 1].id : null;
      const results = hasMore ? reports.slice(0, limit) : reports;

      // Get entity details for each report
      const reportsWithDetails = await Promise.all(
        results.map(async (report) => {
          let entity = null;
          
          if (report.entityType === ENTITY_TYPES.ARTWORK) {
            entity = await prisma.artwork.findUnique({
              where: { id: report.entityId },
              include: {
                artist: {
                  select: {
                    id: true,
                    displayName: true,
                    slug: true
                  }
                },
                images: {
                  orderBy: { position: "asc" },
                  take: 1
                }
              }
            });
          } else if (report.entityType === ENTITY_TYPES.ARTIST) {
            entity = await prisma.artist.findUnique({
              where: { id: report.entityId },
              select: {
                id: true,
                displayName: true,
                slug: true,
                avatarUrl: true
              }
            });
          }

          return {
            ...report,
            entity
          };
        })
      );

      return {
        reports: reportsWithDetails,
        nextCursor,
        hasMore
      };
    } catch (error) {
      console.error("Failed to get reports:", error);
      return reply.status(500).send({ 
        error: "Failed to get reports",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Close report
  fastify.post("/admin/reports/:id/close", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const actorId = (request as any).user?.id;

      if (!actorId) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      await prisma.report.update({
        where: { id },
        data: {
          status: "CLOSED",
          closedAt: new Date()
        }
      });

      // Log audit
      await logAudit({
        actorId,
        action: AUDIT_ACTIONS.CLOSE_REPORT,
        entityType: "REPORT",
        entityId: id
      });

      return { success: true };
    } catch (error) {
      console.error("Failed to close report:", error);
      return reply.status(500).send({ 
        error: "Failed to close report",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}
