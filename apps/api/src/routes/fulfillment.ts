import { FastifyInstance } from "fastify";
import { createRateLimiter } from "@artfromromania/auth";
import { 
  getFulfillmentQueue,
  updateFulfillmentStatus,
  getFulfillmentById
} from "../fulfillment/service";
import { getSignedUrl } from "@artfromromania/storage";

export async function fulfillmentRoutes(fastify: FastifyInstance) {
  const rateLimiter = createRateLimiter("fulfillment", 60, 10); // 10 requests per minute

  // Auth middleware
  const requireAuth = async (request: any, reply: any) => {
    if (!request.user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
  };

  // Role-based auth
  const requireArtistOrAdmin = async (request: any, reply: any) => {
    if (!request.user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    if (request.user.role !== "ARTIST" && request.user.role !== "ADMIN") {
      return reply.status(403).send({ error: "Forbidden: Artist or Admin access required" });
    }
  };

  // Rate limiter middleware wrapper
  const rateLimitMiddleware = (limiter: any) => async (request: any, reply: any) => {
    const clientIp = request.ip || "unknown";
    const rateLimit = await limiter.check(clientIp);

    if (!rateLimit.ok) {
      return reply.status(429).send({ error: "Rate limited" });
    }
  };

  // Get fulfillment queue
  fastify.get("/queue", {
    preHandler: [
      rateLimitMiddleware(rateLimiter),
      requireArtistOrAdmin
    ]
  }, async (request, reply) => {
    try {
      const query = request.query as any;
      const filters = {
        status: query.status ? query.status.split(",") : undefined,
        material: query.material ? query.material.split(",") : undefined,
        assignedToUserId: query.assignedToUserId,
        limit: query.limit ? parseInt(query.limit, 10) : 50,
        offset: query.offset ? parseInt(query.offset, 10) : 0,
      };

      const queue = await getFulfillmentQueue(filters);

      return reply.send({ queue });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: "Failed to fetch fulfillment queue" });
    }
  });

  // Claim fulfillment job
  fastify.post("/:id/claim", {
    preHandler: [
      rateLimitMiddleware(rateLimiter),
      requireArtistOrAdmin
    ]
  }, async (request, reply) => {
    try {
      const fulfillmentId = (request.params as any).id;
      const userId = request.user!.id;

      const fulfillment = await updateFulfillmentStatus(
        fulfillmentId,
        "IN_PRODUCTION",
        {
          assignedToUserId: userId,
          startedAt: new Date(),
        }
      );

      return reply.send({ fulfillment });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: "Failed to claim fulfillment job" });
    }
  });

  // QC pass
  fastify.post("/:id/qc-pass", {
    preHandler: [
      rateLimitMiddleware(rateLimiter),
      requireArtistOrAdmin
    ]
  }, async (request, reply) => {
    try {
      const fulfillmentId = (request.params as any).id;

      const fulfillment = await updateFulfillmentStatus(
        fulfillmentId,
        "IN_PRODUCTION",
        {
          qcPassedAt: new Date(),
        }
      );

      return reply.send({ fulfillment });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: "Failed to mark QC passed" });
    }
  });

  // Ship fulfillment
  fastify.post("/:id/ship", {
    preHandler: [
      rateLimitMiddleware(rateLimiter),
      requireArtistOrAdmin
    ]
  }, async (request, reply) => {
    try {
      const fulfillmentId = (request.params as any).id;
      const { carrier, trackingCode, trackingUrl } = request.body as any;

      if (!carrier || !trackingCode) {
        return reply.status(400).send({ error: "Carrier and tracking code are required" });
      }

      const trackingNumbers = {
        carrier,
        trackingCode,
        trackingUrl,
        shippedAt: new Date().toISOString(),
      };

      const fulfillment = await updateFulfillmentStatus(
        fulfillmentId,
        "SHIPPED",
        {
          finishedAt: new Date(),
          trackingNumbers,
        }
      );

      return reply.send({ fulfillment });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: "Failed to ship fulfillment" });
    }
  });

  // Mark as delivered
  fastify.post("/:id/deliver", {
    preHandler: [
      rateLimitMiddleware(rateLimiter),
      requireArtistOrAdmin
    ]
  }, async (request, reply) => {
    try {
      const fulfillmentId = (request.params as any).id;

      const fulfillment = await updateFulfillmentStatus(
        fulfillmentId,
        "DELIVERED"
      );

      return reply.send({ fulfillment });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: "Failed to mark as delivered" });
    }
  });

  // Get job ticket PDF
  fastify.get("/:id/job-ticket", {
    preHandler: [
      rateLimitMiddleware(rateLimiter),
      requireArtistOrAdmin
    ]
  }, async (request, reply) => {
    try {
      const fulfillmentId = (request.params as any).id;

      const fulfillment = await getFulfillmentById(fulfillmentId);
      if (!fulfillment) {
        return reply.status(404).send({ error: "Fulfillment not found" });
      }

      if (!fulfillment.jobTicketKey) {
        return reply.status(404).send({ error: "Job ticket not found" });
      }

      const signedUrl = await getSignedUrl(fulfillment.jobTicketKey, 3600); // 1 hour

      return reply.send({ url: signedUrl });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: "Failed to get job ticket" });
    }
  });

  // Get fulfillment details
  fastify.get("/:id", {
    preHandler: [
      rateLimitMiddleware(rateLimiter),
      requireArtistOrAdmin
    ]
  }, async (request, reply) => {
    try {
      const fulfillmentId = (request.params as any).id;

      const fulfillment = await getFulfillmentById(fulfillmentId);
      if (!fulfillment) {
        return reply.status(404).send({ error: "Fulfillment not found" });
      }

      return reply.send({ fulfillment });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: "Failed to get fulfillment details" });
    }
  });
}
