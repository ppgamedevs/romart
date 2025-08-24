import { QuoteItem, QuoteResult, SubmitResult, Address } from "../types";
import { dpiFrom } from "../dpi";

type RateTable = {
  zones: { id: string; countries: string[] }[];
  sizeTiers: { id: string; maxLongEdgeCm: number }[];
  rates: {
    zone: string;
    method: "STANDARD" | "EXPRESS";
    tier: string;
    amount: number;
    currency: "EUR";
  }[];
};

const parseRateTable = (): RateTable =>
  JSON.parse(process.env.POD_INHOUSE_RATE_TABLE_JSON || "{}");

const zoneFor = (country: string, table: RateTable) => {
  const upper = (country || "").toUpperCase();
  return table.zones.find((z) => z.countries.includes(upper))?.id ?? "INTL";
};

const tierFor = (w: number, h: number, table: RateTable) => {
  const maxEdge = Math.max(w, h);
  const tier = table.sizeTiers.find((t) => maxEdge <= t.maxLongEdgeCm);
  return tier?.id ?? table.sizeTiers[table.sizeTiers.length - 1].id;
};

export async function quote(
  items: QuoteItem[],
  shipTo: Address
): Promise<QuoteResult> {
  const table = parseRateTable();
  const zone = zoneFor(shipTo.country, table);
  const method =
    (items[0]?.shipMethod ||
      (process.env.POD_DEFAULT_SHIP_METHOD as "STANDARD" | "EXPRESS" | "")) ||
    "STANDARD";
  const tier = tierFor(items[0].widthCm, items[0].heightCm, table);

  const rate = table.rates.find(
    (r) => r.zone === zone && r.method === method && r.tier === tier
  );
  const shippingCost = rate?.amount ?? 0;

  // DPI check (simplu: validăm pe primul item; poți itera toate)
  const required = Number(process.env.POD_PRINT_MIN_DPI || 150);
  const samplePx = 3000; // va fi înlocuit cu rezoluția reală din imageResolver la submit
  const dpiOk = dpiFrom(items[0].widthCm, samplePx) >= required;

  return {
    currency: "EUR",
    items: items.map((i) => ({ orderItemId: i.orderItemId, cost: 0 })),
    shippingCost,
    productionDays: 2,
    minDpiOk: dpiOk,
  };
}

export async function submit(args: {
  fulfillmentId: string;
  items: QuoteItem[];
  shipTo: Address;
  imageResolver: (
    editionId: string
  ) => Promise<{
    key: string;
    widthPx: number;
    heightPx: number;
    contentType: string;
  }>;
  shipMethod?: "STANDARD" | "EXPRESS";
}): Promise<SubmitResult> {
  // Nu trimitem nicăieri extern — doar validăm minim DPI cu imaginea reală.
  const required = Number(process.env.POD_PRINT_MIN_DPI || 150);
  for (const it of args.items) {
    const img = await args.imageResolver(it.editionId);
    const dpi = Math.min(
      img.widthPx / (it.widthCm / 2.54),
      img.heightPx / (it.heightCm / 2.54)
    );
    if (dpi < required) {
      throw new Error(`image_too_low_dpi:${Math.round(dpi)}`);
    }
  }
  return { providerOrderId: args.fulfillmentId, status: "SUBMITTED" };
}
