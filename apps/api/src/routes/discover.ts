import { FastifyInstance } from "fastify";

const PAGE_SIZE = Number(process.env.DISCOVER_PAGE_SIZE || 24);
const WINDOW_DAYS = Number(process.env.RECS_TRENDING_WINDOW_DAYS || 14);

type Sort = "popular" | "price_asc" | "price_desc";

const mediums = new Set(["painting", "drawing", "photography", "digital"]);

export default async function routes(app: FastifyInstance) {
  app.get("/discover", async (req, res) => {
    const q = (req.query as any) || {};
    const page = Math.max(1, parseInt(q.page || "1", 10));
    const sort = (String(q.sort || "popular") as Sort);
    const medium = q.medium && mediums.has(String(q.medium)) ? String(q.medium) : undefined;
    const priceMin = q.min ? Math.max(0, parseInt(q.min, 10)) : undefined; // minor units
    const priceMax = q.max ? Math.max(0, parseInt(q.max, 10)) : undefined;

    const where: any = { published: true };
    if (medium) where.medium = medium;
    if (priceMin || priceMax) {
      where.priceMinor = {
        ...(priceMin ? { gte: priceMin } : {}),
        ...(priceMax ? { lte: priceMax } : {}),
      };
    }

    // preselectăm un pool suficient (pagination + buffer)
    const take = PAGE_SIZE * 6; // buffer pentru sortarea popular
    let pool = await app.prisma.artwork.findMany({
      where,
      select: {
        id: true,
        artistId: true,
        slug: true,
        title: true,
        thumbUrl: true,
        priceMinor: true,
        medium: true,
        createdAt: true,
      },
      take,
      orderBy: [{ createdAt: "desc" }], // fallback initial
    });

    if (sort === "popular" && pool.length) {
      const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
      const ints = await app.prisma.interaction.groupBy({
        by: ["artworkId", "kind"],
        _count: { _all: true },
        where: {
          artworkId: { in: pool.map((p) => p.id) },
          createdAt: { gte: since },
        },
      });

      const score: Record<string, number> = {};
      for (const r of ints) {
        const w =
          r.kind === "VIEW"
            ? 0.1
            : r.kind === "FAVORITE"
            ? 0.5
            : r.kind === "ADD_TO_CART"
            ? 1
            : r.kind === "PURCHASE"
            ? 2
            : 0;
        score[r.artworkId] = (score[r.artworkId] || 0) + w * r._count._all;
      }

      pool = pool
        .map((p) => ({
          p,
          s: (score[p.id] || 0) + (p.createdAt ? 0.1 : 0), // mic tie-breaker pe recency
        }))
        .sort((a, b) => b.s - a.s)
        .map((x) => x.p);
    } else if (sort === "price_asc") {
      pool.sort((a, b) => a.priceMinor - b.priceMinor);
    } else if (sort === "price_desc") {
      pool.sort((a, b) => b.priceMinor - a.priceMinor);
    }

    const total = pool.length;
    const start = (page - 1) * PAGE_SIZE;
    const slice = pool.slice(start, start + PAGE_SIZE);

    return res.send({
      items: slice,
      page,
      pageSize: PAGE_SIZE,
      total,
      hasNext: start + PAGE_SIZE < total,
    });
  });
}
