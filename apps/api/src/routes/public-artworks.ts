import { FastifyInstance } from "fastify";

export default async function routes(app: FastifyInstance) {
  app.get("/public/artworks/:id/quick-view", async (req, res) => {
    const id = (req.params as any).id as string;
    const a = await app.prisma.artwork.findUnique({
      where: { id },
      select: {
        id: true, slug: true, title: true, currency: true, medium: true,
        widthCm: true, heightCm: true, depthCm: true,
        thumbUrl: true, heroUrl: true,
        images: { select: { url: true }, orderBy: { sort: "asc" } },  // dacă există
        artist: { select: { displayName: true } },
        editions: {
          where: { status: "PUBLISHED" },
          select: { id: true, label: true, unitAmount: true, stock: true, kind: true }
        }
      }
    });
    if (!a) return res.code(404).send({ error: "not found" });

    const dims = a.widthCm ? `${a.widthCm}×${a.heightCm}${a.depthCm ? "×"+a.depthCm : ""} cm` : undefined;

    const gallery = (a.images?.map(i=>i.url) || []).filter(Boolean);
    const images = [...new Set([a.heroUrl, a.thumbUrl, ...gallery].filter(Boolean))];

    return res.send({
      id: a.id,
      slug: a.slug,
      title: a.title,
      artistName: a.artist?.displayName,
      currency: a.currency || "EUR",
      thumbUrl: a.thumbUrl,
      heroUrl: a.heroUrl || a.thumbUrl,
      medium: a.medium,
      dimensions: dims,
      images,
      editions: a.editions.map(e => ({
        id: e.id,
        label: e.label,
        priceMinor: e.unitAmount,
        inStock: e.stock == null ? true : e.stock > 0,
        kind: e.kind,
      })),
    });
  });
}
