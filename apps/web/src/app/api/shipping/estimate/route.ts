import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dest = searchParams.get('dest') || 'RO';
  const subtotalMinor = parseInt(searchParams.get('subtotalMinor') || '0', 10);
  
  const isRO = dest === "RO";
  const freeThresh = isRO ? 25000 : 150000; // 250€ RO, 1500€ Intl
  const free = subtotalMinor >= freeThresh;

  const provider = isRO ? "Sameday" : "DHL";
  const minDays = isRO ? 1 : 3;
  const maxDays = isRO ? 3 : 7;

  // Heuristic cost (doar estimativ; în checkout se calculează final)
  const baseMinor = isRO ? 2500 : 3500; // 25€ RO, 35€ Intl
  const estMinor = free ? 0 : baseMinor;

  return NextResponse.json({
    provider,
    dest,
    free,
    etaDays: { min: minDays, max: maxDays },
    estimateMinor: estMinor,
    freeThresholdMinor: freeThresh,
    currency: "EUR"
  });
}
