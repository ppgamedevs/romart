import { prisma } from "@artfromromania/db";

export type CostLookup = {
  baseMinor: number;
  packagingMinor: number;
  leadDays: number;
};

export async function getPrintBaseCost(kind: string, sizeLabel?: string | null): Promise<CostLookup | null> {
  if (!sizeLabel) return null;
  const row = await prisma.printBaseCost.findUnique({
    where: { kind_sizeLabel: { kind, sizeLabel } }
  });
  if (!row || !row.active) return null;
  return { baseMinor: row.baseMinor, packagingMinor: row.packagingMinor, leadDays: row.leadDays };
}

export type ArtistPricing = {
  markupPct: number;       // ex: 0.65
  minMarginPct: number;    // ex: 0.40
  rounding: "NONE" | "END_00" | "END_90" | "END_99";
};

export async function getArtistPricing(artistId?: string, kind?: string): Promise<ArtistPricing> {
  const defMarkup = parseFloat(process.env.PRINT_DEFAULT_MARKUP_PCT || "0.65");
  const lossGuard = parseFloat(process.env.PRINT_MIN_MARGIN_PCT || "0.40");
  const rounding = (process.env.PRICE_ROUNDING || "END_00") as ArtistPricing["rounding"];

  if (!artistId) return { markupPct: defMarkup, minMarginPct: lossGuard, rounding };

  const p = await prisma.artistPricingProfile.findUnique({ where: { artistId } });
  if (!p || !p.active) return { markupPct: defMarkup, minMarginPct: lossGuard, rounding };

  let mk = p.printMarkupPct ?? defMarkup;
  if (kind === "CANVAS" && p.canvasMarkupPct != null) mk = p.canvasMarkupPct;
  if (kind === "METAL" && p.metalMarkupPct != null) mk = p.metalMarkupPct;
  if (kind === "PHOTO" && p.photoMarkupPct != null) mk = p.photoMarkupPct;

  return {
    markupPct: mk,
    minMarginPct: p.minMarginPct ?? lossGuard,
    rounding: p.rounding || rounding
  };
}

export function applyRounding(minor: number, strategy: ArtistPricing["rounding"]): number {
  if (strategy === "NONE") return minor;
  const euros = Math.max(0, Math.floor(minor / 100));
  if (strategy === "END_00") return euros * 100;
  if (strategy === "END_90") return euros * 100 + 90;
  // END_99
  return euros * 100 + 99;
}
