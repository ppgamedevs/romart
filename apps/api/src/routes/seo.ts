import { FastifyInstance } from "fastify";
import { prisma } from "@artfromromania/db";

export default async function seoRoutes(app: FastifyInstance) {
  // Cache headers for SEO endpoints
  app.addHook("onSend", (req, reply, payload, done) => {
    if (req.url?.startsWith("/seo/")) {
      reply.header("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    }
    done();
  });

  // Sitemap data pentru web
  app.get("/seo/sitemap", async (_req, res) => {
    const [artists, artworks] = await Promise.all([
      prisma.artist.findMany({ 
        select: { slug: true, updatedAt: true }, 
        where: { /* public only if needed */ }, 
        orderBy: { updatedAt: "desc" }, 
        take: 25000 
      }),
      prisma.artwork.findMany({ 
        select: { slug: true, updatedAt: true, status: true }, 
        where: { status: "PUBLISHED" }, 
        orderBy: { updatedAt: "desc" }, 
        take: 25000 
      }),
    ]);
    return res.send({ artists, artworks, generatedAt: new Date().toISOString() });
  });

  // Public minimal pentru metadata JSON-LD
  app.get("/public/artist/by-slug/:slug", async (req, res) => {
    const { slug } = req.params as any;
    const a = await prisma.artist.findUnique({
      where: { slug },
      select: { 
        id: true, 
        slug: true, 
        displayName: true, 
        bio: true, 
        avatarUrl: true, 
        socials: true, 
        updatedAt: true 
      }
    });
    if (!a) return res.code(404).send({ error: "not-found" });
    return res.send(a);
  });

  app.get("/public/artwork/by-slug/:slug", async (req, res) => {
    const { slug } = req.params as any;
    const aw = await prisma.artwork.findUnique({
      where: { slug },
      select: {
        id: true, 
        slug: true, 
        title: true, 
        description: true, 
        medium: true,
        priceAmount: true, 
        priceCurrency: true, 
        widthCm: true, 
        heightCm: true, 
        depthCm: true,
        heroImageUrl: true, 
        status: true, 
        updatedAt: true,
        artist: { 
          select: { 
            slug: true, 
            displayName: true, 
            avatarUrl: true 
          } 
        }
      }
    });
    if (!aw || aw.status !== "PUBLISHED") return res.code(404).send({ error: "not-found" });
    return res.send(aw);
  });
}
