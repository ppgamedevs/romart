import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const artworkId = searchParams.get('artworkId');
  const format = searchParams.get('format') || 'ORIGINAL';
  const sizeKey = searchParams.get('sizeKey') || '';
  const qty = parseInt(searchParams.get('qty') || '1', 10);

  // Mock price calculation
  let basePriceMinor = 250000; // 2500 EUR base price
  
  // Format adjustments
  if (format === "CANVAS") {
    basePriceMinor = Math.round(basePriceMinor * 0.3); // 30% of original
  } else if (format === "METAL") {
    basePriceMinor = Math.round(basePriceMinor * 0.4); // 40% of original
  } else if (format === "PHOTO") {
    basePriceMinor = Math.round(basePriceMinor * 0.2); // 20% of original
  }

  // Size adjustments
  if (sizeKey === "M") {
    basePriceMinor = Math.round(basePriceMinor * 1.2); // 20% more for medium
  } else if (sizeKey === "L") {
    basePriceMinor = Math.round(basePriceMinor * 1.5); // 50% more for large
  }

  // Calculate totals
  const netMinor = basePriceMinor;
  const taxMinor = Math.round(netMinor * 0.19); // 19% VAT
  const grossMinor = netMinor + taxMinor;

  return NextResponse.json({
    currency: "EUR",
    unit: {
      netMinor,
      grossMinor
    },
    taxMinor,
    qty,
    total: {
      netMinor: netMinor * qty,
      grossMinor: grossMinor * qty,
      taxMinor: taxMinor * qty
    }
  });
}
