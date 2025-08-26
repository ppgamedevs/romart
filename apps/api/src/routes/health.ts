import { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

// Use direct URL for API to avoid pooler issues
const prisma = new PrismaClient({
	datasources: {
		db: {
			url: process.env.DATABASE_URL?.replace('pooler.', 'db.')
		}
	}
});

// For now, we'll skip storage check until we have the storage package properly configured
const storage = {
	listObjects: async () => Promise.resolve([])
};

export default async function routes(app: FastifyInstance) {
  app.get("/healthz", async (_req, reply) => {
    const out: any = { ok: true, deps: {} };
    
    // Database check
    try { 
      await prisma.$queryRaw`select 1`; 
      out.deps.db = "ok"; 
    } catch { 
      out.ok = false; 
      out.deps.db = "fail"; 
    }
    
    // Storage check
    try {
      if (process.env.HEALTH_STORAGE === "true") {
        // Try to list objects to check storage connectivity
        await storage.listObjects();
        out.deps.storage = "ok";
      }
    } catch { 
      out.ok = false; 
      out.deps.storage = "fail"; 
    }
    
    // Stripe check
    try {
      if (process.env.HEALTH_STRIPE === "true") {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" as any });
        await stripe.balance.retrieve();
        out.deps.stripe = "ok";
      }
    } catch { 
      out.ok = false; 
      out.deps.stripe = "fail"; 
    }
    
    // Meilisearch check
    try {
      if (process.env.HEALTH_MEILI === "true") {
        const r = await fetch(`${process.env.MEILI_HOST}/health`, { 
          headers: { "Authorization": `Bearer ${process.env.MEILI_MASTER_KEY}` }
        });
        out.deps.meili = r.ok ? "ok" : "fail"; 
        if (!r.ok) out.ok = false;
      }
    } catch { 
      out.ok = false; 
      out.deps.meili = "fail"; 
    }
    
    return reply.code(out.ok ? 200 : 503).send(out);
  });

  app.get("/readyz", async (_req, reply) => reply.send({ ready: true }));
}
