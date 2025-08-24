import { rateTableConfig, shippingEnv } from "../env";
import { PackedPackage } from "../types";

export interface RateCalculationParams {
  zone: string;
  method: "STANDARD" | "EXPRESS";
  packages: PackedPackage[];
  insuredAmount: number;
}

export interface RateBreakdown {
  baseRate: number;
  oversizeSurcharge?: number;
  signatureFee?: number;
  insuranceFee?: number;
  total: number;
}

export function priceFor(params: RateCalculationParams): RateBreakdown {
  const { zone, method, packages, insuredAmount } = params;
  
  // Calculate total weight (rounded up to 0.5kg)
  const totalWeightKg = packages.reduce((sum, pkg) => sum + pkg.weightKg, 0);
  const roundedWeightKg = Math.ceil(totalWeightKg * 2) / 2; // Round to 0.5kg
  
  // Check for oversize
  const oversize = packages.some(pkg => {
    const maxSide = Math.max(pkg.lengthCm, pkg.widthCm || 0, pkg.heightCm || 0);
    return maxSide > shippingEnv.SHIP_MAX_SIDE_CM;
  });
  
  // Get base rate
  const baseRate = calculateBaseRate(zone, method, roundedWeightKg);
  
  // Calculate surcharges
  const oversizeSurcharge = oversize ? getOversizeSurcharge(zone) : 0;
  const signatureFee = insuredAmount > 10000 ? getSignatureFee(zone) : 0;
  const insuranceFee = shippingEnv.SHIP_INSURANCE_ENABLED && insuredAmount > 0 
    ? Math.round(insuredAmount * shippingEnv.SHIP_INSURANCE_RATE_BPS / 10000)
    : 0;
  
  const total = baseRate + oversizeSurcharge + signatureFee + insuranceFee;
  
  return {
    baseRate,
    oversizeSurcharge: oversizeSurcharge > 0 ? oversizeSurcharge : undefined,
    signatureFee: signatureFee > 0 ? signatureFee : undefined,
    insuranceFee: insuranceFee > 0 ? insuranceFee : undefined,
    total
  };
}

function calculateBaseRate(zone: string, method: string, weightKg: number): number {
  const baseRates = rateTableConfig.base || [];
  const rate = baseRates.find((r: any) => r.zone === zone && r.service === method);
  
  if (!rate) {
    throw new Error(`No rate found for zone ${zone} and method ${method}`);
  }
  
  if (weightKg <= 1) {
    return rate.firstKg;
  }
  
  const additionalKg = weightKg - 1;
  return rate.firstKg + (rate.addKg * additionalKg);
}

function getOversizeSurcharge(zone: string): number {
  const surcharges = rateTableConfig.oversizeSurcharge || [];
  const surcharge = surcharges.find((s: any) => s.zone === zone);
  return surcharge?.amount || 0;
}

function getSignatureFee(zone: string): number {
  const fees = rateTableConfig.signatureFee || [];
  const fee = fees.find((f: any) => f.zone === zone);
  return fee?.amount || 0;
}
