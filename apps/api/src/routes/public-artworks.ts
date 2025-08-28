import { FastifyInstance } from "fastify";

export default async function routes(app: FastifyInstance) {
  app.get("/public/artworks/:id/quick-view", async (req, res) => {
    const id = (req.params as any).id as string;
    const a = await app.prisma.artwork.findUnique({
      where: { id },
      select: {
        id: true, slug: true, title: true, priceCurrency: true, medium: true,
        widthCm: true, heightCm: true, depthCm: true,
        heroImageUrl: true,
        images: { select: { url: true }, orderBy: { position: "asc" } },
        artist: { select: { displayName: true } },
        editions: {
          select: { id: true, unitAmount: true, available: true, type: true }
        }
      }
    });
    if (!a) return res.code(404).send({ error: "not found" });

    const dims = a.widthCm ? `${a.widthCm}×${a.heightCm}${a.depthCm ? "×"+a.depthCm : ""} cm` : undefined;

    const gallery = (a.images?.map(i=>i.url) || []).filter(Boolean);
    const images = [...new Set([a.heroImageUrl, ...gallery].filter(Boolean))];

    return res.send({
      id: a.id,
      slug: a.slug,
      title: a.title,
      artistName: a.artist?.displayName,
      currency: a.priceCurrency || "EUR",
      heroUrl: a.heroImageUrl,
      medium: a.medium,
      dimensions: dims,
      images,
      editions: a.editions?.map(e => ({
        id: e.id,
        priceMinor: e.unitAmount,
        inStock: e.available == null ? true : e.available > 0,
        kind: e.type,
      })) || [],
    });
  });
}
