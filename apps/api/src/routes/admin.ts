import { FastifyInstance } from "fastify";
import { reindexAllArtworks } from "../searchSync";

export async function adminRoutes(fastify: FastifyInstance) {
  // Admin middleware - you can add authentication here
  fastify.addHook("preHandler", async (request, reply) => {
    // TODO: Add proper admin authentication
    // For now, we'll use a simple header check
    const adminToken = request.headers["x-admin-token"];
    if (adminToken !== "admin-secret") {
      return reply.status(401).send({ error: "Unauthorized" });
    }
  });

  // Reindex all artworks
  fastify.post("/admin/search/reindex", async (request, reply) => {
    try {
      const count = await reindexAllArtworks();
      return { success: true, count };
    } catch (error) {
      console.error("Reindex failed:", error);
      return reply.status(500).send({ 
        error: "Failed to reindex artworks",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}
