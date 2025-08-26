import { FastifyInstance } from "fastify";

function genSlug(n=6){ 
  const a="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"; 
  return Array.from({length:n},()=>a[Math.floor(Math.random()*a.length)]).join(""); 
}

export default async function routes(app: FastifyInstance) {
  // preHandler auth: user -> artist
  app.get("/studio/share-links", async (req, res) => {
    const userId = (req as any).user?.id as string|undefined;
    if (!userId) return res.code(401).send();
    const artist = await app.prisma.artist.findFirst({ where: { userId }, select: { id: true }});
    if (!artist) return res.code(403).send();

    const links = await app.prisma.artistShareLink.findMany({
      where: { artistId: artist.id },
      include: {
        _count: { select: { visits: true, conversions: true } },
        conversions: { select: { subtotalMinor: true }, take: 1000 }
      },
      orderBy: { createdAt: "desc" }
    });
    const rows = links.map(l => ({
      id: l.id, slug: l.slug, landing: l.landing, createdAt: l.createdAt,
      visits: l._count.visits,
      orders: l._count.conversions,
      revenueMinor: l.conversions.reduce((s,c)=>s+(c.subtotalMinor||0),0)
    }));
    res.send({ links: rows });
  });

  app.post("/studio/share-links", async (req, res) => {
    const userId = (req as any).user?.id as string|undefined;
    if (!userId) return res.code(401).send();
    const artist = await app.prisma.artist.findFirst({ where: { userId }, select: { id: true }});
    if (!artist) return res.code(403).send();

    const body = (req.body as any) || {};
    const landing = body.landing && String(body.landing).startsWith("/") ? String(body.landing) : "/"; // sanitize
    const slug = genSlug(6);
    const link = await app.prisma.artistShareLink.create({ data: { artistId: artist.id, landing, slug }});
    res.send({ ok: true, link });
  });
}
