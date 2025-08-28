import { prisma } from "@artfromromania/db";
import { scoreSimilar, trendingFormula } from "../lib/recs/scoring";

export async function buildSimilarAll() {
  const all = await prisma.artwork.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      artistId: true,
      priceAmount: true,
      medium: true
    }
  });

  const TOL = Number(process.env.RECS_PRICE_BAND_TOLERANCE || 0.35);

  for (const src of all) {
    const lo = Math.floor(src.priceAmount * (1 - TOL)), hi = Math.ceil(src.priceAmount * (1 + TOL));
    const cands = all.filter((c: any) => 
      c.id !== src.id && 
      c.medium === src.medium && 
      c.priceAmount >= lo && 
      c.priceAmount <= hi
    );

    const scored = cands
      .map((c: any) => ({ id: c.id, s: scoreSimilar(src as any, c as any, 0) }))
      .sort((a: any, b: any) => b.s - a.s)
      .slice(0, 50);

    await prisma.$transaction([
      prisma.similarArtwork.deleteMany({ where: { artworkId: src.id } }),
      prisma.similarArtwork.createMany({
        data: scored.map((s: any) => ({
          artworkId: src.id,
          similarId: s.id,
          score: s.s
        }))
      })
    ]);
  }
}

export async function buildTrendingDay(date: Date) {
  const dayStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayEnd = new Date(dayStart.getTime() + 24 * 3600 * 1000);

  const ints = await prisma.interaction.groupBy({
    by: ["artworkId", "kind"],
    _count: { _all: true },
    where: {
      createdAt: { gte: dayStart, lt: dayEnd }
    }
  });

  const agg: Record<string, { views: number; favs: number; carts: number; buys: number }> = {};
  for (const r of ints) {
    agg[r.artworkId] ||= { views: 0, favs: 0, carts: 0, buys: 0 };
    if (r.kind === "VIEW") agg[r.artworkId].views += r._count._all;
    if (r.kind === "FAVORITE") agg[r.artworkId].favs += r._count._all;
    if (r.kind === "ADD_TO_CART") agg[r.artworkId].carts += r._count._all;
    if (r.kind === "PURCHASE") agg[r.artworkId].buys += r._count._all;
  }

  const rows = Object.entries(agg).map(([id, v]) => ({
    day: dayStart,
    artworkId: id,
    score: trendingFormula(v)
  }));

  await prisma.$transaction([
    prisma.trendingDaily.deleteMany({ where: { day: dayStart } }),
    prisma.trendingDaily.createMany({ data: rows })
  ]);
}
