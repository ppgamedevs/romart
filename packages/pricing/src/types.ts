export type QuoteInput = {
  artworkId: string;
  editionId?: string | null;
  qty?: number;                      // default 1
  shipToCountry?: string;            // ISO2 (ex: "RO", "DE", "US")
  currency?: string;                 // default ENV
};

export type QuoteBreakdown = {
  currency: string;
  qty: number;
  unit: {
    listMinor: number;               // preț listat (după promo/sale)
    discountsMinor: number;          // total reducere aplicată (negativ)
    netMinor: number;                // list - discounts
    vatMinor: number;                // TVA/unit
    subtotalMinor: number;           // net + TVA
  };
  shippingMinor: number;             // estimare shipping (total)
  freeShippingApplied: boolean;
  totalMinor: number;                // subtotal*qty + shipping
  rulesApplied: { id: string; name: string; deltaMinor: number }[];
};
