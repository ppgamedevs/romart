import { FastifyInstance } from "fastify";
import { prisma } from "@artfromromania/db";

function requireArtist(req: any) { 
  if (!req.user) throw new Error("auth"); 
  // TODO: Add artist role check when user model is updated
}

function bucketizeLag(mins: number) {
  const m = mins;
  if (m <= 24 * 60) return "0-1d";
  if (m <= 7 * 24 * 60) return "1-7d";
  if (m <= 30 * 24 * 60) return "7-30d";
  return ">30d";
}

export default async function routes(app: FastifyInstance) {
  app.get("/studio/insights", async (req, res) => {
    requireArtist(req);
    const artistId = req.user!.id; // TODO: Update when artist model is available
    const days = parseInt(process.env.INSIGHTS_WINDOW_DAYS || "30", 10);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Funnel counts (last N days)
    const [views, saves, atc, co, pur] = await Promise.all([
      prisma.analyticsEvent.count({ where: { artistId, type: "VIEW_ARTWORK", ts: { gte: since } } }),
      prisma.analyticsEvent.count({ where: { artistId, type: "SAVE_ARTWORK", ts: { gte: since } } }),
      prisma.analyticsEvent.count({ where: { artistId, type: "ADD_TO_CART", ts: { gte: since } } }),
      prisma.analyticsEvent.count({ where: { artistId, type: "CHECKOUT_START", ts: { gte: since } } }),
      prisma.analyticsEvent.count({ where: { artistId, type: "PURCHASED", ts: { gte: since } } }),
    ]);

    // Top artworks by purchase
    const top = await prisma.analyticsEvent.groupBy({
      by: ["artworkId"], 
      where: { artistId, type: "PURCHASED", ts: { gte: since } },
      _count: { _all: true }, 
      _sum: { priceMinor: true }, 
      orderBy: { _count: { _all: "desc" } }, 
      take: 10
    });

    // Channels (utmSource) on PURCHASED
    const channels = await prisma.analyticsEvent.groupBy({
      by: ["utmSource"], 
      where: { artistId, type: "PURCHASED", ts: { gte: since } }, 
      _count: { _all: true }
    });

    // Lag: prima SAVE vs. prima PURCHASE pe (sessionId, artworkId)
    const purchases = await prisma.analyticsEvent.findMany({
      where: { artistId, type: "PURCHASED", ts: { gte: since } },
      select: { sessionId: true, artworkId: true, ts: true }
    });
    const lags: Record<string, number> = { "0-1d": 0, "1-7d": 0, "7-30d": 0, ">30d": 0 };
    for (const p of purchases) {
      if (!p.sessionId || !p.artworkId) continue;
      const firstSave = await prisma.analyticsEvent.findFirst({
        where: { artistId, type: "SAVE_ARTWORK", sessionId: p.sessionId, artworkId: p.artworkId, ts: { lte: p.ts } },
        orderBy: { ts: "asc" }, 
        select: { ts: true }
      });
      if (!firstSave) continue;
      const mins = Math.floor((p.ts.getTime() - firstSave.ts.getTime()) / 60000);
      lags[bucketizeLag(mins)]++;
    }

    res.send({
      windowDays: days,
      funnel: { views, saves, addToCart: atc, checkout: co, purchases: pur },
      topArtworks: top.map(t => ({ 
        artworkId: t.artworkId, 
        count: t._count._all, 
        revenueMinor: t._sum.priceMinor || 0 
      })),
      channels: channels.map(c => ({ 
        source: c.utmSource || "direct", 
        count: c._count._all 
      })),
      lagBuckets: lags
    });
  });
}
