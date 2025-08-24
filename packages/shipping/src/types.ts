export type Packable = {
  orderItemId: string;
  kind: "ORIGINAL" | "PRINT" | "OTHER";
  qty: number;
  // artwork dims (cm) + weight estimat (kg)
  widthCm: number; 
  heightCm: number; 
  depthCm?: number; 
  framed?: boolean; 
  weightKg?: number;
  // preferință ambalare
  preferred: "BOX" | "TUBE";
  // value minor units (pentru asigurare)
  unitAmount: number;
};

export type QuoteOption = { 
  method: "STANDARD"|"EXPRESS"; 
  serviceName?: string; 
  amount: number; 
  currency: "EUR"; 
  etaDays: [number, number]; 
  breakdown?: any 
};

export type PackedPackage = { 
  kind: "BOX"|"TUBE"; 
  refId?: string; 
  lengthCm: number; 
  widthCm?: number; 
  heightCm?: number; 
  diameterCm?: number; 
  weightKg: number; 
  dimWeightKg: number; 
  items: Array<{orderItemId: string; qty: number}> 
};

export type ShippingAddress = {
  country: string;
  postcode?: string;
  city?: string;
  state?: string;
};

export type PackingResult = {
  packages: PackedPackage[];
  oversize: boolean;
  totalWeightKg: number;
  totalDimWeightKg: number;
};
