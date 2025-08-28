import { FastifyInstance } from "fastify";
import { createRateLimiter } from "@artfromromania/auth";
import { 
  getArtistPayoutSummary, 
  getArtistRecentPayouts,
  getPendingPayoutsDue,
  updatePayoutStatus
} from "@artfromromania/db";
// import { createTransferToArtist, getPlatformFeeBps } from "../payments/connect";

// Temporary implementations until connect module is ready
function getPlatformFeeBps(): number {
  return parseInt(process.env.PLATFORM_FEE_BPS || "300"); // 3% default
}

async function createTransferToArtist(
  artistId: string,
  amount: number,
  currency: string,
  orderId: string,
  description: string
): Promise<any> {
  // This would integrate with Stripe Connect for actual transfers
  // For now, return a mock transfer object
  return {
    id: `tr_${Date.now()}_${artistId}`,
    amount,
    currency,
    status: "pending"
  };
}
import { Prisma } from "@artfromromania/db";

export async function payoutsRoutes(fastify: FastifyInstance) {
  const rateLimiter = createRateLimiter("payouts", 60, 10); // 10 requests per minute

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

  // Admin auth
  const requireAdmin = async (request: any, reply: any) => {
    if (!request.user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    if (request.user.role !== "ADMIN") {
      return reply.status(403).send({ error: "Forbidden: Admin access required" });
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

  // Get payout summary for artist
  fastify.get("/summary", {
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

      const summary = await getArtistPayoutSummary(fastify.prisma, artist.id);
      const recentPayouts = await getArtistRecentPayouts(fastify.prisma, artist.id, 10);
      const platformFeeBps = getPlatformFeeBps();

      return reply.send({
        summary,
        recentPayouts,
        platformFee: platformFeeBps / 100, // Convert to percentage
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: "Failed to fetch payout summary" });
    }
  });

  // Get recent payouts for artist
  fastify.get("/recent", {
    preHandler: [
      rateLimitMiddleware(rateLimiter),
      requireArtist
    ]
  }, async (request, reply) => {
    try {
      const limit = parseInt((request.query as any).limit || "10", 10);

      // Get artist ID from user
      const artist = await fastify.prisma.artist.findUnique({
        where: { userId: request.user!.id },
        select: { id: true }
      });

      if (!artist) {
        return reply.status(404).send({ error: "Artist profile not found" });
      }

      const recentPayouts = await getArtistRecentPayouts(fastify.prisma, artist.id, limit);

      return reply.send({ recentPayouts });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: "Failed to fetch recent payouts" });
    }
  });

  // Admin: Process pending payouts
  fastify.post("/run-due", {
    preHandler: [
      rateLimitMiddleware(rateLimiter),
      requireAdmin
    ]
  }, async (request, reply) => {
    try {
      const limit = parseInt((request.body as any).limit || "50", 10);
      
      const pendingPayouts = await getPendingPayoutsDue(fastify.prisma, limit);
      const results = {
        processed: 0,
        failed: 0,
        errors: [] as string[]
      };

      // Type for payout with relations
      type PayoutWithRelations = Prisma.PayoutGetPayload<{
        include: {
          artist: {
            select: {
              id: true;
              stripeAccountId: true;
              payoutsEnabled: true;
            };
          };
          orderItem: {
            select: {
              id: true;
              order: {
                select: {
                  id: true;
                };
              };
            };
          };
        };
      }>;

      for (const payout of pendingPayouts as PayoutWithRelations[]) {
        try {
          // Check if artist is eligible
          if (!payout.artist?.stripeAccountId || !payout.artist?.payoutsEnabled) {
            results.errors.push(`Artist ${payout.artist?.id || payout.artistId} not eligible for payouts`);
            results.failed++;
            continue;
          }

          // Create transfer
          const transfer = await createTransferToArtist(
            payout.artist.id,
            payout.amount,
            payout.currency || "EUR",
            payout.orderItem?.order?.id || "unknown",
            `RomArt payout for order ${payout.orderItem?.order?.id || "unknown"}`
          );

          // Update payout status
          await updatePayoutStatus(
            fastify.prisma,
            payout.id,
            "PAID",
            transfer.id
          );

          results.processed++;
        } catch (error) {
          fastify.log.error(`Failed to process payout ${payout.id}:`, error as any);
          results.errors.push(`Payout ${payout.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          results.failed++;
        }
      }

      return reply.send({
        success: true,
        results,
        totalProcessed: pendingPayouts.length
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: "Failed to process pending payouts" });
    }
  });
}
