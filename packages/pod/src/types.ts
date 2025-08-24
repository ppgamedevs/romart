export type PodMaterial = "CANVAS" | "METAL";

export type QuoteItem = {
  orderItemId: string;
  editionId: string;
  material: PodMaterial;
  widthCm: number;
  heightCm: number;
  qty: number;
  shipMethod?: "STANDARD" | "EXPRESS";
};

export type Address = {
  name: string;
  line1: string;
  city: string;
  country: string;
  region?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
};

export type QuoteResult = {
  currency: "EUR";
  items: Array<{ orderItemId: string; cost: number }>;
  shippingCost: number;
  productionDays: number;
  minDpiOk: boolean;
  notes?: string;
};

export type SubmitResult = {
  providerOrderId: string;
  status: "SUBMITTED" | "IN_PRODUCTION";
  estimatedShip?: string;
  raw?: any;
};
