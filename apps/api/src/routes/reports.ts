import { FastifyInstance } from "fastify";
import { prisma } from "@artfromromania/db";
import { createRateLimiter } from "@artfromromania/auth";
import { 
  REPORT_CATEGORIES,
  ENTITY_TYPES,
  AUDIT_ACTIONS
} from "@artfromromania/shared";
import { logAudit } from "../moderation/service";

export async function reportsRoutes(fastify: FastifyInstance) {
  // Rate limiter for reports
  const reportsRateLimiter = createRateLimiter(
    "reports", 
    parseInt(process.env.REPORTS_RATE_PER_HOUR || "30"), 
    3600
  );

  // Create a report
  fastify.post("/reports", async (request, reply) => {
    try {
      // Rate limiting
      const clientIp = request.ip || "unknown";
      const rateLimit = await reportsRateLimiter.check(clientIp);
      
      if (!rateLimit.ok) {
        return reply.status(429).send({ error: "rate_limited" });
      }

      const { entityType, entityId, category, message } = request.body as {
        entityType: string;
        entityId: string;
        category: string;
        message?: string;
      };

          // Validate entity type
    if (!Object.values(ENTITY_TYPES).includes(entityType as any)) {
      return reply.status(400).send({ error: "Invalid entity type" });
    }

    // Validate category
    if (!Object.values(REPORT_CATEGORIES).includes(category as any)) {
      return reply.status(400).send({ error: "Invalid category" });
    }

      // Check if entity exists
      let entity = null;
      if (entityType === ENTITY_TYPES.ARTWORK) {
        entity = await prisma.artwork.findUnique({
          where: { id: entityId }
        });
      } else if (entityType === ENTITY_TYPES.ARTIST) {
        entity = await prisma.artist.findUnique({
          where: { id: entityId }
        });
      }

      if (!entity) {
        return reply.status(404).send({ error: "Entity not found" });
      }

      // Get reporter ID if authenticated
      const reporterId = (request as any).user?.id;

      // Create report
      const report = await prisma.report.create({
        data: {
          reporterId,
          entityType,
          entityId,
          category,
          message,
          status: "OPEN"
        }
      });

      // Check if we need to create a moderation item
      const reportCount = await prisma.report.count({
        where: {
          entityType,
          entityId,
          status: "OPEN"
        }
      });

      // If 3+ reports, increase flagged count and prioritize moderation
      if (reportCount >= 3) {
        if (entityType === ENTITY_TYPES.ARTWORK) {
          await prisma.artwork.update({
            where: { id: entityId },
            data: {
              flaggedCount: {
                increment: 1
              }
            }
          });
        }
      }

      // Log audit
      await logAudit({
        actorId: reporterId,
        action: AUDIT_ACTIONS.CREATE_REPORT,
        entityType,
        entityId,
        ip: clientIp,
        userAgent: request.headers["user-agent"],
        data: {
          category,
          message,
          reportId: report.id
        }
      });

      return { 
        success: true, 
        reportId: report.id 
      };
    } catch (error) {
      console.error("Failed to create report:", error);
      return reply.status(500).send({ 
        error: "Failed to create report",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get report categories (public endpoint)
  fastify.get("/reports/categories", async (request, reply) => {
    return {
      categories: Object.entries(REPORT_CATEGORIES).map(([key, value]) => ({
        key,
        value,
        label: key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()
      }))
    };
  });
}
