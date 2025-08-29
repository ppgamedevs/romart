import { FastifyInstance } from "fastify";
import { prisma } from "@artfromromania/db";

export default async function routes(app: FastifyInstance) {
  app.get("/public/slugs/artworks", async (_req, res) => {
    const rows = await prisma.artwork.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true }
    });
    res.send(rows.map(r => ({ slug: r.slug, updatedAt: r.updatedAt })));
  });

  app.get("/public/slugs/artists", async (_req, res) => {
    const rows = await prisma.artist.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true }
    });
    res.send(rows.map(r => ({ slug: r.slug, updatedAt: r.updatedAt })));
  });

  app.get("/public/slugs/collections", async (_req, res) => {
    const rows = await prisma.collection.findMany({
      where: { publishedAt: { not: null } },
      select: { slug: true, updatedAt: true }
    });
    res.send(rows.map(r => ({ slug: r.slug, updatedAt: r.updatedAt })));
  });
}
