import { FastifyInstance } from "fastify";
import { scoreSimilar, trendingFormula } from "../lib/recs/scoring";

const MAX = Number(process.env.RECS_MAX_PER_SECTION || 16);
const TOL = Number(process.env.RECS_PRICE_BAND_TOLERANCE || 0.35);

function filterEligible(a: any) {
  return a.published && a.available !== false;
}

export default async function routes(app: FastifyInstance) {
  // 1) Similar by artwork
  app.get("/recommendations/artwork/:id/similar", async (req, res) => {
    const id = (req.params as any).id as string;
    const src = await app.prisma.artwork.findUnique({
      where: { id },
      select: {
        id: true,
        artistId: true,
        priceAmount: true,
        medium: true,
        status: true
      }
    });
    
    if (!src || src.status !== "PUBLISHED") return res.send({ items: [] });

    // dacă avem precompute
    const pre = await app.prisma.similarArtwork.findMany({
      where: { artworkId: id },
      orderBy: { score: "desc" },
      take: MAX * 2
    });

    let items;
    if (pre.length) {
      const ids = pre.map(p => p.similarId);
      const arts = await app.prisma.artwork.findMany({
        where: {
          id: { in: ids },
          status: "PUBLISHED"
        },
        select: {
          id: true,
          artistId: true,
          slug: true,
          title: true,
          heroImageUrl: true,
          priceAmount: true,
          medium: true
        }
      });

      // păstrează ordinea după score
      const map = new Map(arts.map((a: any) => [a.id, a]));
      items = pre.map((p: any) => map.get(p.similarId)).filter(Boolean);
    } else {
      // fallback: candidați apropiați (același medium + bandă de preț)
      const lo = Math.floor(src.priceAmount * (1 - TOL)), hi = Math.ceil(src.priceAmount * (1 + TOL));
      const cands = await app.prisma.artwork.findMany({
        where: {
          id: { not: id },
          status: "PUBLISHED",
          medium: src.medium,
          priceAmount: { gte: lo, lte: hi }
        },
        select: {
          id: true,
          artistId: true,
          priceAmount: true,
          medium: true,
          slug: true,
          title: true,
          heroImageUrl: true
        }
      });

      // popularitate simplă în ultimele 14 zile
      const since = new Date(Date.now() - 14 * 24 * 3600 * 1000);
      const ints = await app.prisma.interaction.groupBy({
        by: ["artworkId", "kind"],
        _count: { _all: true },
        where: {
          artworkId: { in: cands.map(c => c.id) },
          createdAt: { gte: since }
        }
      });

      const pop: Record<string, number> = {};
      for (const r of ints) {
        pop[r.artworkId] = (pop[r.artworkId] || 0) + (
          r.kind === "VIEW" ? 0.1 :
          r.kind === "FAVORITE" ? 0.5 :
          r.kind === "ADD_TO_CART" ? 1 :
          r.kind === "PURCHASE" ? 2 : 0
        );
      }

      items = cands
        .map((c: any) => ({ c, s: scoreSimilar(src as any, c as any, pop[c.id] || 0) }))
        .sort((a, b) => b.s - a.s)
        .map(x => ({
          id: x.c.id,
          artistId: x.c.artistId,
          slug: x.c.slug,
          title: x.c.title,
          heroImageUrl: x.c.heroImageUrl,
          priceAmount: x.c.priceAmount,
          medium: x.c.medium
        }));
    }

    // diversitate artist + limit
    const seen = new Set<string>();
    const out: any[] = [];
    for (const it of items) {
      if (!it) continue;
      const key = String(it.artistId);
      if (process.env.RECS_DIVERSITY_ARTIST === "true" && seen.has(key)) continue;
      seen.add(key);
      out.push(it);
      if (out.length >= MAX) break;
    }

    return res.send({ items: out });
  });

  // 2) More from this artist
  app.get("/recommendations/artist/:id/more", async (req, res) => {
    const artistId = (req.params as any).id as string;
    const items = await app.prisma.artwork.findMany({
      where: { artistId, status: "PUBLISHED" },
      orderBy: [{ createdAt: "desc" }],
      take: MAX
    });
    
    return res.send({ items: items.filter(filterEligible) });
  });

  // 3) Trending (ultimele RECS_TRENDING_WINDOW_DAYS)
  app.get("/recommendations/trending", async (_req, res) => {
    const days = Number(process.env.RECS_TRENDING_WINDOW_DAYS || 14);
    const since = new Date(Date.now() - days * 24 * 3600 * 1000);
    
    const ints = await app.prisma.interaction.groupBy({
      by: ["artworkId", "kind"],
      _count: { _all: true },
      where: { createdAt: { gte: since } }
    });

    const agg: Record<string, { views: number; favs: number; carts: number; buys: number }> = {};
    for (const r of ints) {
      agg[r.artworkId] ||= { views: 0, favs: 0, carts: 0, buys: 0 };
      if (r.kind === "VIEW") agg[r.artworkId].views += r._count._all;
      if (r.kind === "FAVORITE") agg[r.artworkId].favs += r._count._all;
      if (r.kind === "ADD_TO_CART") agg[r.artworkId].carts += r._count._all;
      if (r.kind === "PURCHASE") agg[r.artworkId].buys += r._count._all;
    }

    const scores = Object.entries(agg)
      .map(([id, v]) => ({ id, s: trendingFormula(v) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, MAX * 2);

    const arts = await app.prisma.artwork.findMany({
      where: {
        id: { in: scores.map(s => s.id) },
        status: "PUBLISHED"
      }
    });

    return res.send({ items: arts.slice(0, MAX).filter(filterEligible) });
  });

  // 4) For You (user)
  app.get("/recommendations/for-you", async (req, res) => {
    const userId = (req as any).user?.id as string | undefined;
    if (!userId) return res.code(401).send({ items: [] });

    // preferințe derivate (medium & price)
    const prefs = await app.prisma.userPreference.findUnique({
      where: { userId }
    });

    // semnale recente ale userului
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const recent = await app.prisma.interaction.findMany({
      where: {
        userId,
        createdAt: { gte: since },
        kind: { in: ["VIEW", "FAVORITE", "ADD_TO_CART", "PURCHASE"] }
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { artworkId: true }
    });

    const seeds = [...new Set(recent.map((r: any) => r.artworkId).filter(Boolean))].slice(0, 10);

    // candidați = trending + lucrări similare seed + filtrare medium/price dacă există prefs
    const trend = await app.prisma.artwork.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: MAX * 3,
      select: {
        id: true,
        artistId: true,
        priceAmount: true,
        medium: true,
        slug: true,
        title: true,
        heroImageUrl: true
      }
    });

    const cands = new Map(trend.map(a => [a.id!, a]));

    if (seeds.length) {
      const sim = await app.prisma.similarArtwork.findMany({
        where: { artworkId: { in: seeds } },
        orderBy: { score: "desc" },
        take: MAX * 4
      });

      const simIds = [...new Set(sim.map((s: any) => s.similarId).filter(Boolean))].slice(0, MAX * 4);
      if (simIds.length) {
        const simArts = await app.prisma.artwork.findMany({
          where: {
            id: { in: simIds },
            status: "PUBLISHED"
          },
          select: {
            id: true,
            artistId: true,
            priceAmount: true,
            medium: true,
            slug: true,
            title: true,
            heroImageUrl: true
          }
        });
        simArts.forEach(a => cands.set(a.id!, a));
      }
    }

    let pool = Array.from(cands.values());
    if (prefs?.topMediums?.length) {
      pool = pool.filter(p => p.medium && prefs.topMediums.includes(p.medium));
    }
    if (prefs?.priceP50) {
      const lo = Math.floor(prefs.priceP50 * (1 - TOL)), hi = Math.ceil(prefs.priceP50 * (1 + TOL));
      pool = pool.filter(p => p.priceAmount >= lo && p.priceAmount <= hi);
    }

    // Filter out items without artistId first
    const filteredPool = pool.filter(p => p.artistId != null);

         // ordonare simplă: întâi similare cu ultimele văzute, apoi trending (prin createdAt desc ca fallback)
     // (pentru simplitate, păstrăm ordinea existentă, doar diversificăm pe artist)
     const seenArtists = new Set<string>();
     const out: any[] = [];
     for (const it of filteredPool) {
       if (process.env.RECS_DIVERSITY_ARTIST === "true" && seenArtists.has(String(it.artistId))) continue;
       seenArtists.add(String(it.artistId));
       out.push(it);
       if (out.length >= MAX) break;
     }

    return res.send({ items: out });
  });
}
