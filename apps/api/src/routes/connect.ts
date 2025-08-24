import { FastifyInstance } from "fastify";
import { createRateLimiter } from "@artfromromania/auth";
import { 
  createOnboardingLink, 
  getLoginLink, 
  refreshAccountStatus 
} from "../payments/connect";
import { z } from "zod";

export async function connectRoutes(fastify: FastifyInstance) {
  const rateLimiter = createRateLimiter("connect", 60, 10); // 10 requests per minute

  // Auth middleware
  const requireAuth = async (request: any, reply: any) => {
    if (!request.user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
  };

  // Role-based auth
  const requireArtist = async (request: any, reply: any) => {
    if (!request.user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    if (request.user.role !== "ARTIST") {
      return reply.status(403).send({ error: "Forbidden: Artist access required" });
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

  // Create onboarding link
  fastify.post("/onboarding", {
    preHandler: [
      rateLimitMiddleware(rateLimiter),
      requireArtist
    ]
  }, async (request, reply) => {
    try {
      // Get artist ID from user
      const artist = await fastify.prisma.artist.findUnique({
        where: { userId: request.user!.id },
        select: { id: true }
      });

      if (!artist) {
        return reply.status(404).send({ error: "Artist profile not found" });
      }

      const onboardingUrl = await createOnboardingLink(artist.id);

      return reply.send({ onboardingUrl });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: "Failed to create onboarding link" });
    }
  });

  // Refresh account status
  fastify.post("/refresh-status", {
    preHandler: [
      rateLimitMiddleware(rateLimiter),
      requireArtist
    ]
  }, async (request, reply) => {
    try {
      // Get artist ID from user
      const artist = await fastify.prisma.artist.findUnique({
        where: { userId: request.user!.id },
        select: { id: true }
      });

      if (!artist) {
        return reply.status(404).send({ error: "Artist profile not found" });
      }

      await refreshAccountStatus(artist.id);

      // Get updated artist data
      const updatedArtist = await fastify.prisma.artist.findUnique({
        where: { id: artist.id },
        select: {
          stripeAccountId: true,
          payoutsEnabled: true,
          connectStatus: true,
          connectRequirements: true
        }
      });

      return reply.send({ 
        success: true,
        account: updatedArtist
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: "Failed to refresh account status" });
    }
  });

  // Get login link
  fastify.get("/login-link", {
    preHandler: [
      rateLimitMiddleware(rateLimiter),
      requireArtist
    ]
  }, async (request, reply) => {
    try {
      // Get artist ID from user
      const artist = await fastify.prisma.artist.findUnique({
        where: { userId: request.user!.id },
        select: { id: true, payoutsEnabled: true }
      });

      if (!artist) {
        return reply.status(404).send({ error: "Artist profile not found" });
      }

      if (!artist.payoutsEnabled) {
        return reply.status(400).send({ error: "Payouts not enabled" });
      }

      const loginUrl = await getLoginLink(artist.id);

      return reply.send({ loginUrl });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: "Failed to create login link" });
    }
  });
}
