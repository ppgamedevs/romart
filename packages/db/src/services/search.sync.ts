import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function pickSale(list?: number | null, sale?: number | null, onSale?: boolean | null) {
  if (list == null) return null;
  if (onSale && sale != null && sale <= list) return sale;
  return list;
}

async function computeMinPrice(art: any): Promise<number | null> {
  // 1) original direct
  let candidates: number[] = [];
  if (art.priceMinor != null) candidates.push(pickSale(art.priceMinor, art.saleMinor, art.onSale) ?? art.priceMinor);

  // 2) editions declarate
  for (const e of (art.editions || [])) {
    if (e.priceMinor != null) candidates.push(pickSale(e.priceMinor, e.saleMinor, e.onSale) ?? e.priceMinor);
  }
  if (candidates.length > 0) return Math.min(...candidates);

  // 3) fallback (opțional) — calculează „de la" via getQuote() pe prima ediție PRINT activă
  if ((process.env.SEARCH_MINPRICE_USE_QUOTE || "false") === "true") {
    const first = (art.editions || []).find((e: any) => e.active && e.kind !== "ORIGINAL");
    if (first) {
      try {
        // Note: This would require the pricing package to be available
        // const q = await getQuote({ artworkId: art.id, editionId: first.id, qty: 1, shipToCountry: "RO" });
        // return q?.unit?.netMinor ?? null;
        return null; // Placeholder for now
      } catch {}
    }
  }
  return null;
}

export async function upsertSearchItem(artId: string) {
  const a = await prisma.artwork.findUnique({
    where: { id: artId },
    include: {
      editions: true,
      artist: { select: { displayName: true, id: true } },
      collections: { select: { id: true } },
      // dacă ai tags separate, include și alea
    }
  });
  if (!a) return;

  const priceMinor = pickSale(a.priceMinor, a.saleMinor, a.onSale) ?? a.priceMinor ?? null;
  const minPriceMinor = await computeMinPrice(a);

  const tags: string[] = [
    a.medium,
    ...new Set<string>([].concat(a.editions?.map((e: any) => e.kind) as any || []))
  ].filter(Boolean);

  const curatedScore = (a.featured ? 1 : 0) + (a.collections?.length || 0) * 0.25;

  const since30 = new Date(Date.now() - 30 * 864e5);
  const since90 = new Date(Date.now() - 90 * 864e5);
  const [views30, saves30, purchases90] = await Promise.all([
    prisma.analyticsEvent.count({ where: { artworkId: artId, type: "VIEW_ARTWORK", ts: { gte: since30 } } }),
    prisma.analyticsEvent.count({ where: { artworkId: artId, type: "SAVE_ARTWORK", ts: { gte: since30 } } }),
    prisma.analyticsEvent.count({ where: { artworkId: artId, type: "PURCHASED", ts: { gte: since90 } } })
  ]);

  // boostScore precomputat (vezi recomputeBoosts() mai jos)
  const boost = await prisma.searchItem.findUnique({ where: { id: artId }, select: { boostScore: true } });

  // Convert Decimal to number for widthCm/heightCm
  const widthCm = a.widthCm ? Number(a.widthCm) : null;
  const heightCm = a.heightCm ? Number(a.heightCm) : null;

  const orientation = ((): string | null => {
    if (!widthCm || !heightCm) return null;
    if (Math.abs(widthCm - heightCm) <= Math.min(widthCm, heightCm) * 0.1) return "SQUARE";
    return widthCm > heightCm ? "LANDSCAPE" : "PORTRAIT";
  })();

  await prisma.searchItem.upsert({
    where: { id: artId },
    create: {
      id: a.id, kind: "ARTWORK", slug: a.slug, title: a.title,
      artistName: a.artist?.displayName || "Unknown", medium: a.medium as any,
      tags, priceMinor, minPriceMinor,
      widthCm, heightCm, orientation,
      curatedScore, boostScore: boost?.boostScore ?? 0,
      views30, saves30, purchases90,
      publishedAt: a.published ? a.updatedAt : null
    },
    update: {
      slug: a.slug, title: a.title, artistName: a.artist?.displayName || "Unknown",
      medium: a.medium as any, tags, priceMinor, minPriceMinor,
      widthCm, heightCm, orientation,
      curatedScore,
      views30, saves30, purchases90,
      publishedAt: a.published ? a.updatedAt : null
    }
  });
}

/** Recalculează boostScore pentru item-urile afectate de reguli active */
export async function recomputeBoostsForAll() {
  const rules = await prisma.searchBoostRule.findMany({ where: { active: true } });
  const items = await prisma.searchItem.findMany({ select: { id: true, medium: true, tags: true } });
  const now = new Date();

  for (const it of items) {
    let score = 0;
    for (const r of rules) {
      if (r.startsAt && now < r.startsAt) continue;
      if (r.endsAt && now > r.endsAt) continue;
      if (r.scope === "GLOBAL") score += r.weight;
      if (r.scope === "MEDIUM" && r.medium === it.medium) score += r.weight;
      if (r.scope === "TAG" && r.tag && it.tags.includes(r.tag)) score += r.weight;
      // NOTE: scope ARTIST/ARTWORK necesită join; îl aplicăm în upsert individual (mai jos)
    }
    score = Math.min(score, parseFloat(process.env.SEARCH_BOOST_MAX || "3"));
    await prisma.searchItem.update({ where: { id: it.id }, data: { boostScore: score } });
  }
}

/** Recompute pentru un artwork (ca să ținem cont de ARTIST/ARTWORK) */
export async function recomputeBoostsForArtwork(artId: string) {
  const it = await prisma.searchItem.findUnique({ where: { id: artId }, select: { id: true, medium: true, tags: true } });
  if (!it) return;
  const a = await prisma.artwork.findUnique({ where: { id: artId }, select: { artistId: true } });
  const rules = await prisma.searchBoostRule.findMany({ where: { active: true } });
  const now = new Date();
  let score = 0;
  for (const r of rules) {
    if (r.startsAt && now < r.startsAt) continue;
    if (r.endsAt && now > r.endsAt) continue;
    if (r.scope === "GLOBAL") score += r.weight;
    if (r.scope === "MEDIUM" && r.medium === it.medium) score += r.weight;
    if (r.scope === "TAG" && r.tag && it.tags.includes(r.tag)) score += r.weight;
    if (r.scope === "ARTIST" && a?.artistId && r.artistId === a.artistId) score += r.weight;
    if (r.scope === "ARTWORK" && r.artworkId === it.id) score += r.weight;
  }
  score = Math.min(score, parseFloat(process.env.SEARCH_BOOST_MAX || "3"));
  await prisma.searchItem.update({ where: { id: it.id }, data: { boostScore: score } });
}
