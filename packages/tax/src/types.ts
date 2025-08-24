import { z } from "zod";

export type TaxContext = {
  originCountry: string;   // ex "RO"
  destinationCountry?: string; // determinat din shipping/billing
  isBusiness?: boolean;
  vatId?: string | null;
  digital?: boolean;       // true pentru DIGITAL
};

export type VatValidationResult = {
  valid: boolean;
  name?: string;
  address?: string;
  checkedAt?: Date;
};

export type TaxLine = {
  itemId: string;
  description: string;
  quantity: number;
  unitAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
};

export type TaxCalculation = {
  subtotal: number;
  tax: number;
  total: number;
  lines: TaxLine[];
  reverseCharge: boolean;
  notes?: string;
};

export type OrderItem = {
  id: string;
  kind: "ORIGINAL" | "PRINT" | "DIGITAL";
  quantity: number;
  unitAmount: number;
  description: string;
};

export type Address = {
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode?: string;
  country: string;
  isBusiness?: boolean;
  vatId?: string;
};

// Zod schemas for validation
export const VatValidationSchema = z.object({
  country: z.string().length(2),
  vatId: z.string().min(1)
});

export const TaxContextSchema = z.object({
  originCountry: z.string().length(2),
  destinationCountry: z.string().length(2).optional(),
  isBusiness: z.boolean().optional(),
  vatId: z.string().nullable().optional(),
  digital: z.boolean().optional()
});
