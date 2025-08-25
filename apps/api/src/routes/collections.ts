import { FastifyInstance } from "fastify";
import { z } from "zod";
// Use fastify-decorated prisma instance

const CreateCollectionSchema = z.object({
  slug: z.string(),
  title: z.record(z.string()), // {en: "...", ro: "..."}
  description: z.record(z.string()).optional(),
  coverKey: z.string().optional(),
});

const AddItemSchema = z.object({
  artworkId: z.string(),
  order: z.number().optional(),
});

export async function collectionRoutes(fastify: FastifyInstance) {
  const { prisma } = fastify;
  // POST /admin/collections - Create a curated collection
  fastify.post("/admin/collections", {
    preHandler: [],
    schema: {
      body: {
        type: "object",
        properties: {
          slug: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          coverKey: { type: "string" }
        },
        required: ["slug", "title"]
      },
    },
  }, async (request, reply) => {
    const { slug, title, description, coverKey } = request.body as z.infer<typeof CreateCollectionSchema>;
    const user = request.user;

    if (!user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    // Check if user is admin or curator
    if (user.role !== "ADMIN" && user.role !== "CURATOR") {
      return reply.status(403).send({ error: "Forbidden" });
    }

    try {
      // Check if slug is unique
      const existing = await prisma.curatedCollection.findUnique({
        where: { slug },
      });

      if (existing) {
        return reply.status(409).send({ error: "Collection with this slug already exists" });
      }

      // Create collection
      const collection = await prisma.curatedCollection.create({
        data: {
          slug,
          title,
          description,
          coverKey,
        },
      });

      return reply.send({ success: true, collection });
    } catch (error) {
      console.error("Error creating collection:", error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  // POST /admin/collections/:id/items - Add artwork to collection
  fastify.post("/admin/collections/:id/items", {
    preHandler: [],
    schema: {
      body: {
        type: "object",
        properties: {
          artworkId: { type: "string" },
          order: { type: "number" }
        },
        required: ["artworkId"]
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { artworkId, order } = request.body as z.infer<typeof AddItemSchema>;
    const user = request.user;

    if (!user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    // Check if user is admin or curator
    if (user.role !== "ADMIN" && user.role !== "CURATOR") {
      return reply.status(403).send({ error: "Forbidden" });
    }

    try {
      // Check if collection exists
      const collection = await prisma.curatedCollection.findUnique({
        where: { id },
      });

      if (!collection) {
        return reply.status(404).send({ error: "Collection not found" });
      }

      // Check if artwork exists and is published
      const artwork = await prisma.artwork.findUnique({
        where: { id: artworkId },
        select: { id: true, status: true, visibility: true }
      });

      if (!artwork || artwork.status !== "PUBLISHED" || artwork.visibility !== "PUBLIC") {
        return reply.status(404).send({ error: "Artwork not found or not available" });
      }

      // Add item to collection
      const item = await prisma.collectionItem.create({
        data: {
          collectionId: id,
          artworkId,
          order: order || 0,
        },
      });

      return reply.send({ success: true, item });
    } catch (error) {
      console.error("Error adding item to collection:", error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  // DELETE /admin/collections/:id/items/:itemId - Remove artwork from collection
  fastify.delete("/admin/collections/:id/items/:itemId", {
    preHandler: [],
  }, async (request, reply) => {
    const { id, itemId } = request.params as { id: string; itemId: string };
    const user = request.user;

    if (!user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    // Check if user is admin or curator
    if (user.role !== "ADMIN" && user.role !== "CURATOR") {
      return reply.status(403).send({ error: "Forbidden" });
    }

    try {
      const deleted = await prisma.collectionItem.deleteMany({
        where: {
          id: itemId,
          collectionId: id,
        },
      });

      if (deleted.count === 0) {
        return reply.status(404).send({ error: "Item not found" });
      }

      return reply.send({ success: true });
    } catch (error) {
      console.error("Error removing item from collection:", error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  // GET /collections - List public collections
  fastify.get("/collections", async (request, reply) => {
    try {
      const collections = await prisma.curatedCollection.findMany({
        where: { isPublic: true },
        include: {
          _count: {
            select: { items: true },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return reply.send({ collections });
    } catch (error) {
      console.error("Error fetching collections:", error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  // GET /collections/:slug - Get collection details
  fastify.get("/collections/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const { page = "1", limit = "20" } = request.query as { page?: string; limit?: string };

    try {
      const collection = await prisma.curatedCollection.findUnique({
        where: { slug, isPublic: true },
      });

      if (!collection) {
        return reply.status(404).send({ error: "Collection not found" });
      }

      // Get artworks in collection with pagination
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;

      const items = await prisma.collectionItem.findMany({
        where: { collectionId: collection.id },
        include: {
          artwork: {
            select: {
              id: true,
              title: true,
              heroImageUrl: true,
              priceAmount: true,
              priceCurrency: true,
              artist: {
                select: {
                  id: true,
                  displayName: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: { order: "asc" },
        skip: offset,
        take: limitNum,
      });

      const total = await prisma.collectionItem.count({
        where: { collectionId: collection.id },
      });

      return reply.send({
        collection,
        items: items.map(item => item.artwork),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error("Error fetching collection:", error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  // POST /admin/jobs/collections-sitemap - Generate collections sitemap
  fastify.post("/admin/jobs/collections-sitemap", {
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
      const collections = await prisma.curatedCollection.findMany({
        where: { isPublic: true },
        select: { slug: true, createdAt: true },
      });

      // In a real implementation, this would generate and save a sitemap
      // For now, just return the collection slugs
      return reply.send({
        success: true,
        collections: collections.map(c => ({
          slug: c.slug,
          lastModified: c.createdAt,
        })),
      });
    } catch (error) {
      console.error("Error generating collections sitemap:", error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });
}
