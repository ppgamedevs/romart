import 'dotenv/config';
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import cookie from "@fastify/cookie";
import { getUptime, getTimestamp } from "@artfromromania/shared";
import { PrismaClient } from "@prisma/client";

// Use direct URL for API to avoid pooler issues
const prisma = new PrismaClient({
	datasources: {
		db: {
			url: process.env.DATABASE_URL?.replace('pooler.', 'db.')
		}
	}
});
import { authPlugin } from "./plugins/auth";
import { createRateLimiter } from "@artfromromania/auth";
import { uploadRoutes } from "./routes/uploads";

const fastify = Fastify({
	logger: true
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

		await fastify.register(helmet);
		await fastify.register(cookie);
		await fastify.register(authPlugin);

		// Register routes
		await fastify.register(uploadRoutes, { prefix: "/uploads" });
		await fastify.register(uploadRoutes, { prefix: "/media" });

		// Rate limiters
		const apiRateLimiter = createRateLimiter("api", 60, 60); // 60 requests per minute

		// Health check route
		fastify.get("/healthz", async (request, reply) => {
			// Rate limiting
			const clientIp = request.ip || "unknown";
			const rateLimit = await apiRateLimiter.check(clientIp);
			
			if (!rateLimit.ok) {
				return reply.status(429).send({ error: "rate_limited" });
			}
			const health: {
				ok: boolean;
				uptime: number;
				env: string;
				timestamp: string;
				db: {
					ok: boolean;
					artists: number;
					artworks: number;
					orders: number;
					error: string | undefined;
				};
			} = {
				ok: true,
				uptime: getUptime(),
				env: process.env.NODE_ENV || "development",
				timestamp: getTimestamp(),
				db: {
					ok: false,
					artists: 0,
					artworks: 0,
					orders: 0,
					error: undefined
				}
			};

			// Try to get database counts
			try {
				const [artists, artworks, orders] = await Promise.all([
					prisma.artist.count(),
					prisma.artwork.count(),
					prisma.order.count()
				]);

				health.db = {
					ok: true,
					artists,
					artworks,
					orders,
					error: undefined
				};
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : "Unknown database error";
				fastify.log.warn("Database health check failed: " + errorMessage);
				health.db = {
					ok: false,
					artists: 0,
					artworks: 0,
					orders: 0,
					error: errorMessage
				};
			}

			return reply.send(health);
		});

		// Root route
		fastify.get("/", async (request, reply) => {
			return reply.send({ 
				message: "Artfromromania API", 
				version: "0.1.0",
				docs: "/docs",
				status: "running"
			});
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
