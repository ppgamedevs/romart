import { z } from "zod";

const envSchema = z.object({
  SHIP_PROVIDER: z.enum(["INHOUSE", "SHIPPO", "EASYPOST"]).default("INHOUSE"),
  SHIP_ORIGIN_COUNTRY: z.string().default("RO"),
  SHIP_ORIGIN_POSTCODE: z.string().default("010000"),
  SHIP_DEFAULT_METHOD: z.enum(["STANDARD", "EXPRESS"]).default("STANDARD"),
  SHIP_INSURANCE_ENABLED: z.string().transform(val => val === "true").default("true"),
  SHIP_INSURANCE_RATE_BPS: z.string().transform(val => parseInt(val, 10)).default("100"),
  SHIP_DIM_WEIGHT_DIVISOR: z.string().transform(val => parseInt(val, 10)).default("5000"),
  SHIP_MAX_SIDE_CM: z.string().transform(val => parseInt(val, 10)).default("150"),
  SHIP_PACKAGES_JSON: z.string().default("{}"),
  SHIP_RATE_TABLE_JSON: z.string().default("{}"),
});

export const shippingEnv = envSchema.parse(process.env);

// Parse JSON configurations
export const packagesConfig = JSON.parse(shippingEnv.SHIP_PACKAGES_JSON);
export const rateTableConfig = JSON.parse(shippingEnv.SHIP_RATE_TABLE_JSON);
