// IMPORTANT: Make sure to import `instrument.js` at the top of your file.
require("../instrument.js");

import 'dotenv/config';
import Fastify from "fastify";
import * as Sentry from "@sentry/node";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import pino from "pino";
import { v4 as uuidv4 } from "uuid";
import { PrismaClient } from "@artfromromania/db";
import { inquiryRoutes } from "./routes/inquiries";
import { favoriteRoutes } from "./routes/favorites";
import { statsRoutes } from "./routes/stats";
import { badgeRoutes } from "./routes/badges";
import { collectionRoutes } from "./routes/collections";
import testNotificationsRoutes from "./routes/admin/test-notifications";
import testEmailRoutes from "./routes/admin/test-email";
import testShippingEmailRoutes from "./routes/admin/test-shipping-email";
import healthRoutes from "./routes/health";
import { alertSlack } from "./lib/ops";

// Use direct URL for API to avoid pooler issues
const prisma = new PrismaClient({
	datasources: {
		db: {
			url: process.env.DATABASE_URL?.replace('pooler.', 'db.')
		}
	}
});

// Declare Prisma on Fastify instance
declare module "fastify" {
	interface FastifyInstance {
		prisma: PrismaClient;
	}
}

import { authPlugin } from "./plugins/auth";
import { createRateLimiter } from "@artfromromania/auth";
import { uploadRoutes } from "./routes/uploads";
import { adminRoutes } from "./routes/admin";
import { paymentRoutes } from "./routes/payments";
import { taxRoutes } from "./routes/tax";
import { invoiceRoutes } from "./routes/invoices";
import { studioRoutes } from "./routes/studio";
import { downloadRoutes } from "./routes/downloads";
import { fulfillmentRoutes } from "./routes/fulfillment";
import { searchRoutes } from "./routes/search";
import { moderationRoutes } from "./routes/moderation";
import { reportsRoutes } from "./routes/reports";
import { returnsRoutes } from "./routes/returns";
import { consentRoutes } from "./routes/consent";
import { legalRoutes } from "./routes/legal";
import { ensureIndexes } from "@artfromromania/search";
import affiliatesRoutes from "./routes/affiliates";
import analyticsRoutes from "./routes/analytics";
import shareLinksRoutes from "./routes/studio/share-links";
import artistShareRoutes from "./routes/artist-share";
import recommendationsRoutes from "./routes/recommendations";
import interactionsRoutes from "./routes/interactions";
import discoverRoutes from "./routes/discover";
import publicArtworksRoutes from "./routes/public-artworks";
import cartRoutes from "./routes/cart";
import cartMiniRoutes from "./routes/cart-mini";
import seoRoutes from "./routes/seo";
import metricsRoutes from "./routes/metrics";
import curatorsPublic from "./routes/curators.public";
import curatorsOps from "./routes/curators.ops";
import curatorPayoutsStripe from "./routes/curator.payouts.stripe";
import curatorPayoutsAdmin from "./routes/curator.payouts.admin";
import curatorProfile from "./routes/curator.profile";
import stripeRefunds from "./routes/stripe.refunds";
import priceQuote from "./routes/price.quote";
import adminPriceRules from "./routes/admin.price-rules";
import adminCosting from "./routes/admin.costing";
import adminCampaigns from "./routes/admin.campaigns";
import promoBulk from "./routes/promo.bulk";
import collectionsPublic from "./routes/collections.public";
import collectionsAdmin from "./routes/collections.admin";
import trackRoutes from "./routes/track";
import studioInsights from "./routes/studio.insights";
import searchReindex from "./routes/search.reindex";
import searchPublic from "./routes/search.public";
import searchAdmin from "./routes/search.admin";
import qaAdmin from "./routes/qa.admin";
import cronQa from "./routes/cron.qa";
import publicSlugs from "./routes/public.slugs";
import homeFeed from "./routes/home.feed";
import publicArtist from "./routes/public.artist";
import publicArtistWorks from "./routes/public.artist.works";
import adminArtist from "./routes/admin.artist";

// Create Fastify instance with Pino logger
const fastify = Fastify({ 
	logger: {
		level: process.env.LOG_LEVEL || "info"
	},
	trustProxy: true // Trust proxy for proper IP detection
});

// Setup Sentry error handler for Fastify
Sentry.setupFastifyErrorHandler(fastify);

// Add request ID middleware
fastify.addHook("onRequest", async (req, reply) => {
  const rid = (req.headers["x-request-id"] as string) || uuidv4();
  reply.header("x-request-id", rid);
  (req as any).requestId = rid;
});

// Register Sentry hooks
fastify.register(async (instance) => {
  instance.addHook("onError", async (req, reply, err) => {
    Sentry.withScope(scope => {
      scope.setTag("request_id", (req as any).requestId);
      scope.setContext("request", { url: req.url, method: req.method });
      Sentry.captureException(err);
    });
  });
  
  instance.addHook("onResponse", async (req, reply) => {
    // Corelate logs with request ID
    instance.log.info({ 
      msg: "response", 
      path: req.url, 
      status: reply.statusCode, 
      rid: (req as any).requestId 
    });
  });
});

// Start server
const start = async () => {
	try {
		// Register plugins
		await fastify.register(cors, {
			origin: process.env.NODE_ENV === "production" 
				? ["https://artfromromania.com"] 
				: true
		});

		await fastify.register(helmet, { 
			contentSecurityPolicy: false 
		});
		
		await fastify.register(cookie);
		await fastify.register(authPlugin);

		// Performance optimizations
		await fastify.register(import("@fastify/etag"));
		await fastify.register(import("@fastify/compress"), { 
			global: true, 
			encodings: ["br", "gzip", "deflate"] 
		});

		// Rate limiting
		await fastify.register(rateLimit, { 
			max: 200, 
			timeWindow: "1 minute", 
			keyGenerator: (req) => req.ip 
		});

		// Decorate with Prisma
		fastify.decorate("prisma", prisma);

		// Cache pentru GET populare (discover/recommendations/search)
		fastify.addHook("onSend", (req, reply, _payload, done) => {
			if (req.method === "GET" && (
					req.url?.startsWith("/discover") ||
					req.url?.startsWith("/recommendations") ||
					req.url?.startsWith("/public/") ||
					req.url?.startsWith("/seo/")
			)) {
				reply.header("Cache-Control", "public, s-maxage=300, stale-while-revalidate=86400");
			}
			done();
		});

		// Server-Timing (debug timpi DB)
		fastify.addHook("onRequest", async (req, reply) => { 
			(req as any)._t0 = process.hrtime.bigint(); 
		});
		fastify.addHook("onSend", (req, reply, payload, done) => {
			const t0 = (req as any)._t0 as bigint | undefined;
			if (t0) {
				const ms = Number((process.hrtime.bigint() - t0) / 1000000n);
				reply.header("Server-Timing", `app;dur=${ms}`);
			}
			done();
		});

		// Register routes
		await fastify.register(uploadRoutes, { prefix: "/uploads" });
		await fastify.register(uploadRoutes, { prefix: "/media" });
		await fastify.register(adminRoutes);
		await fastify.register(paymentRoutes);
		await fastify.register(taxRoutes, { prefix: "/tax" });
		await fastify.register(invoiceRoutes, { prefix: "/invoices" });
		await fastify.register(studioRoutes, { prefix: "/studio" });
		await fastify.register(shareLinksRoutes, { prefix: "/studio" });
		await fastify.register(downloadRoutes, { prefix: "/downloads" });
		await fastify.register(fulfillmentRoutes, { prefix: "/fulfillment" });
		await fastify.register(searchRoutes, { prefix: "/search" });
		await fastify.register(moderationRoutes);
		await fastify.register(reportsRoutes);
		await fastify.register(returnsRoutes, { prefix: "/returns" });
		await fastify.register(consentRoutes, { prefix: "/consent" });
		await fastify.register(legalRoutes, { prefix: "/legal" });
		await fastify.register(affiliatesRoutes, { prefix: "/aff" });
		await fastify.register(analyticsRoutes);
		await fastify.register(artistShareRoutes);
		await fastify.register(recommendationsRoutes);
		await fastify.register(interactionsRoutes);
		await fastify.register(discoverRoutes);
		await fastify.register(publicArtworksRoutes);
		await fastify.register(cartRoutes);
		await fastify.register(cartMiniRoutes);
		await fastify.register(seoRoutes);
		await fastify.register(metricsRoutes);
		await fastify.register(inquiryRoutes);
		await fastify.register(favoriteRoutes);
		await fastify.register(statsRoutes);
		await fastify.register(badgeRoutes);
		await fastify.register(collectionRoutes);
		await fastify.register(testNotificationsRoutes);
		await fastify.register(testEmailRoutes);
		await fastify.register(testShippingEmailRoutes);
		await fastify.register(healthRoutes);
		await fastify.register(priceQuote);
		await fastify.register(adminPriceRules);
		await fastify.register(adminCosting);
		await fastify.register(adminCampaigns);
await fastify.register(promoBulk);
await fastify.register(collectionsPublic);
await fastify.register(collectionsAdmin);
await fastify.register(trackRoutes);
await fastify.register(studioInsights);
await fastify.register(searchReindex);
await fastify.register(searchPublic);
		await fastify.register(searchAdmin);
		await fastify.register(qaAdmin);
		await fastify.register(cronQa);
		await fastify.register(publicSlugs);
		await fastify.register(homeFeed);
		await fastify.register(publicArtist);
		await fastify.register(publicArtistWorks);
		await fastify.register(adminArtist);
		
		// Curator routes
		await fastify.register(curatorsPublic);
		await fastify.register(curatorsOps);
		await fastify.register(curatorPayoutsStripe);
		await fastify.register(curatorPayoutsAdmin);
		await fastify.register(curatorProfile);
		await fastify.register(stripeRefunds);

		// Rate limiters
		const apiRateLimiter = createRateLimiter("api", 60, 60); // 60 requests per minute



		// Root route
		fastify.get("/", async (request, reply) => {
			return reply.send({ 
				message: "Artfromromania API", 
				version: "0.1.0",
				docs: "/docs",
				status: "running",
				requestId: (request as any).requestId
			});
		});

		// Debug Sentry route
		fastify.get("/debug-sentry", function mainHandler(req, reply) {
			throw new Error("My first Sentry error!");
		});

		// Protected user route
		fastify.get("/me", {
			preHandler: async (request, reply) => {
				// Rate limiting
				const clientIp = request.ip || "unknown";
				const rateLimit = await apiRateLimiter.check(clientIp);
				
				if (!rateLimit.ok) {
					return reply.status(429).send({ error: "rate_limited" });
				}

				// Role check
				if (!request.user) {
					return reply.status(401).send({ error: "Unauthorized" });
				}

				const allowedRoles = ["BUYER", "ARTIST", "ADMIN"];
				if (!allowedRoles.includes(request.user.role)) {
					return reply.status(403).send({ error: "Forbidden" });
				}
			}
		}, async (request, reply) => {
			return reply.send(request.user);
		});

		const port = parseInt(process.env.PORT || "3001", 10);
		const host = process.env.HOST || "0.0.0.0";
		
		await fastify.listen({ port, host });
		console.log(`🚀 Artfromromania API running on http://${host}:${port}`);
		
		// Test database connection
		try {
			await prisma.$connect();
			console.log(`📊 Database connected successfully`);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Unknown error";
			console.log(`⚠️  Database connection failed: ${errorMessage}`);
			console.log(`   Run 'pnpm db:up' to start PostgreSQL`);
		}

		// Initialize search indexes
		try {
			await ensureIndexes();
			console.log(`🔍 Search indexes initialized successfully`);
		} catch (error) {
			console.log(`⚠️  Search indexes initialization failed: ${error instanceof Error ? error.message : "Unknown error"}`);
			console.log(`   Make sure Meilisearch is running and configured`);
		}
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
};

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
	console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
	
	try {
		await prisma.$disconnect();
		console.log("✅ Database connection closed");
		
		await fastify.close();
		console.log("✅ Fastify server closed");
		
		process.exit(0);
	} catch (error) {
		console.error("❌ Error during shutdown:", error);
		process.exit(1);
	}
};

// Handle shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

start();
