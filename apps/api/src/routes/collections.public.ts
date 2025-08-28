import { FastifyInstance } from "fastify";
import { prisma } from "@artfromromania/db";

export default async function routes(app: FastifyInstance) {
  app.get("/public/collections", async (req, res) => {
    const q = (req.query as any) || {};
    const pageSize = Math.min(60, parseInt(process.env.COLLECTIONS_PAGE_SIZE || "24", 10));
    const items = await prisma.curatedCollection.findMany({
      where: { 
        publishedAt: { not: null },
        isPublic: true
      },
      orderBy: [{ isFeatured: "desc" }, { sortIndex: "asc" }, { updatedAt: "desc" }],
      take: pageSize,
      select: { 
        slug: true, 
        title: true, 
        subtitle: true, 
        coverImageUrl: true, 
        heroTone: true, 
        isFeatured: true, 
        curatorId: true 
      }
    });
    res.send({ items });
  });

  app.get("/public/collection/:slug", async (req, res) => {
    const { slug } = req.params as any;
    const col = await prisma.curatedCollection.findUnique({
      where: { slug },
      include: {
        curator: { select: { displayName: true, slug: true, avatarUrl: true } },
        items: { 
          include: { 
            artwork: { 
              select: { 
                id: true, 
                slug: true, 
                title: true, 
                images: true, 
                medium: true, 
                priceMinor: true, 
                saleMinor: true, 
                onSale: true, 
                currency: true 
              } 
            } 
          },
          orderBy: { sortIndex: "asc" } 
        }
      }
    });
    if (!col || !col.publishedAt || !col.isPublic) return res.code(404).send({ error: "not-found" });
    res.send({
      slug: col.slug, 
      title: col.title, 
      subtitle: col.subtitle,
      description: col.description, 
      coverImageUrl: col.coverImageUrl,
      heroTone: col.heroTone, 
      curator: col.curator,
      artworks: col.items.map(i => i.artwork)
    });
  });
}
