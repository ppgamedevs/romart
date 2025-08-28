import { prisma } from "@artfromromania/db";
import type { QuoteInput, QuoteBreakdown } from "./types";
import { getPrintBaseCost, getArtistPricing, applyRounding } from "./costing";
import { loadActiveCampaigns, applyCampaigns } from "./campaigns";

function inWindow(now: Date, s?: Date | null, e?: Date | null) {
  if (s && now < s) return false;
  if (e && now > e) return false;
  return true;
}

function isEU(iso2: string) {
  const EU = new Set(["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE"]);
  return EU.has(iso2.toUpperCase());
}

function isPrint(kind?: string | null) { return !!kind && kind !== "ORIGINAL"; }

function parseBaseTable(): Record<string, number> {
  try {
    const arr = JSON.parse(process.env.PRINT_BASE_COST_JSON || "[]");
    const map: Record<string, number> = {};
    for (const r of arr) map[`${r.kind}:${r.size}`] = Number(r.baseMinor || 0);
    return map;
  } catch { 
    return {}; 
  }
}

export async function getQuote(input: QuoteInput): Promise<QuoteBreakdown> {
  const qty = Math.max(1, input.qty ?? 1);
  const currency = input.currency || process.env.DEFAULT_CURRENCY || "EUR";
  const baseTable = parseBaseTable();
  const now = new Date();

  const art = await prisma.artwork.findUnique({
    where: { id: input.artworkId },
    include: { 
      editions: true,
      artist: { select: { id: true } }
    }
  });
  if (!art) throw new Error("artwork-not-found");

  const ed = input.editionId ? art.editions.find(e => e.id === input.editionId) : null;

  // 1) determină list price pentru PRINT (din DB cost + markup & rounding) dacă nu există priceMinor pe edition
  let computedFromCost = false;
  let list = 0;

  if (ed?.priceMinor != null) {
    list = ed.onSale && ed.saleMinor != null ? ed.saleMinor : ed.priceMinor;
  } else if (isPrint(ed?.kind || null)) {
    const base = await getPrintBaseCost(ed!.kind || "", ed!.sizeLabel || null);
    if (!base) throw new Error("no-cost-table");
    const ap = await getArtistPricing(art.artist?.id, ed!.kind || undefined);

    const variableCost = base.baseMinor + (base.packagingMinor || parseInt(process.env.PRINT_DEFAULT_PACKAGING_MINOR || "0", 10));
    const priceFromMarkup = Math.round(variableCost * (1 + ap.markupPct));
    const minGuard = Math.round(variableCost * (1 + ap.minMarginPct));
    const guardApplied = Math.max(priceFromMarkup, minGuard);
    list = applyRounding(guardApplied, ap.rounding);
    computedFromCost = true;
  } else if (art.priceMinor != null) {
    list = art.onSale && art.saleMinor != null ? art.saleMinor : art.priceMinor;
  } else if (ed && ed.kind !== "ORIGINAL") {
    // print derivat fără preț setat -> cost din tabel + markup default (fallback pentru compatibilitate)
    const key = `${ed.kind}:${ed.sizeLabel || ""}`;
    const base = baseTable[key] ?? 0;
    const markup = Math.max(0, parseFloat(process.env.PRINT_DEFAULT_MARKUP_PCT || "0.65"));
    list = Math.round(base * (1 + markup));
  } else {
    throw new Error("no-price");
  }

  // 2) CAMPAIGNS — aplicate înainte de PriceRule
  const editionKind = ed?.kind || (art.kind === "ORIGINAL" ? "ORIGINAL" : undefined);
  const campaigns = await loadActiveCampaigns({
    now, medium: art.medium || "", artworkId: art.id, editionKind, artistId: art.artist?.id || null
  });
  const cRes = applyCampaigns(list, campaigns);

  // 3) PRICE RULES (Prompt 36) — păstrează logica existentă
  const rules = await prisma.priceRule.findMany({
    where: { active: true },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }]
  });
  let running = cRes.running;
  const applied: any[] = [...cRes.applied];

  for (const r of rules) {
    const inWindow = (!r.startsAt || now >= r.startsAt) && (!r.endsAt || now <= r.endsAt);
    if (!inWindow) continue;
    const scopeOk =
      r.scope === "GLOBAL" ||
      (r.scope === "MEDIUM" && r.medium === art.medium) ||
      (r.scope === "ARTWORK" && r.artworkId === art.id) ||
      (r.scope === "EDITION" && ed && r.editionId === ed.id) ||
      (r.scope === "DIGITAL" && art.medium === "DIGITAL");
    if (!scopeOk) continue;

    const deltaPct = r.pct ? Math.round(running * r.pct) : 0;
    const deltaAdd = r.addMinor ?? 0;
    const delta = deltaPct + deltaAdd;
    if (!delta) continue;

    running = running + delta;
    applied.push({ id: r.id, name: r.name, deltaMinor: delta, source: "PRICERULE" });
    if (!r.stackable) break;
  }

  const listMinor = Math.max(0, list);
  const netMinor = Math.max(0, running);
  const discountsMinor = netMinor - listMinor; // negativ dacă reducere

  // 3) TVA (simplificat)
  const dest = (input.shipToCountry || "RO").toUpperCase();
  const vatRate = (() => {
    if (dest === (process.env.VAT_HOME_COUNTRY || "RO")) return parseFloat(process.env.VAT_STANDARD_RATE || "0.19");
    if ((process.env.VAT_ZERO_EXPORT || "true") === "true" && !isEU(dest)) return 0;
    // UE: aplicăm rata de bază (simplificat)
    return parseFloat(process.env.VAT_STANDARD_RATE || "0.19");
  })();
  const vatMinorUnit = Math.round(netMinor * vatRate);
  const subtotalUnit = netMinor + vatMinorUnit;

  // 4) Shipping (flat + praguri free)
  const totalGoods = subtotalUnit * qty;
  const freeRo = parseInt(process.env.FREE_SHIPPING_RO_MINOR || "25000", 10);
  const freeIntl = parseInt(process.env.FREE_SHIPPING_INTL_MINOR || "150000", 10);
  const flatRo = parseInt(process.env.SHIPPING_FLAT_RO_MINOR || "3000", 10);
  const flatIntl = parseInt(process.env.SHIPPING_FLAT_INTL_MINOR || "8000", 10);

  const isRO = dest === "RO";
  const freeThreshold = isRO ? freeRo : freeIntl;
  const flat = isRO ? flatRo : flatIntl;

  const freeShippingApplied = totalGoods >= freeThreshold;
  const shippingMinor = freeShippingApplied ? 0 : flat;

  const totalMinor = totalGoods + shippingMinor;

  return {
    currency,
    qty,
    unit: {
      listMinor: listMinor,
      discountsMinor,  // negativ = reduceri
      netMinor: netMinor,
      vatMinor: vatMinorUnit,
      subtotalMinor: subtotalUnit,
    },
    shippingMinor,
    freeShippingApplied,
    totalMinor,
    rulesApplied: applied
  };
}

export type { QuoteInput, QuoteBreakdown } from "./types";
