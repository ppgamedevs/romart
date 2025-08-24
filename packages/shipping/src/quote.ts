import { Packable, QuoteOption, ShippingAddress, PackedPackage } from "./types";
import { packItems } from "./packer";
import { zoneFor } from "./zones";
import { priceFor } from "./rates/inhouse";
import { getRates as getShippoRates } from "./providers/shippo";
import { getRates as getEasyPostRates } from "./providers/easypost";
import { shippingEnv } from "./env";

export interface QuoteRequest {
  items: Packable[];
  shipTo: ShippingAddress;
  methodPref?: "STANDARD" | "EXPRESS";
}

export interface QuoteResult {
  options: QuoteOption[];
  packed: PackedPackage[];
  oversize: boolean;
  totalWeightKg: number;
  totalDimWeightKg: number;
}

export async function quoteOriginal(request: QuoteRequest): Promise<QuoteResult> {
  const { items, shipTo, methodPref } = request;
  
  // Pack items
  const packingResult = packItems(items);
  
  // Determine zone
  const zone = zoneFor(shipTo.country);
  
  // Calculate insured amount
  const insuredAmount = items.reduce((sum, item) => sum + (item.unitAmount * item.qty), 0);
  
  let options: QuoteOption[] = [];
  
  if (shippingEnv.SHIP_PROVIDER === "INHOUSE") {
    // Use in-house rate table
    options = calculateInhouseOptions(zone, packingResult, insuredAmount);
  } else if (shippingEnv.SHIP_PROVIDER === "SHIPPO") {
    // Use Shippo
    options = await getShippoRates({
      from: {
        country: shippingEnv.SHIP_ORIGIN_COUNTRY,
        postcode: shippingEnv.SHIP_ORIGIN_POSTCODE
      },
      to: {
        country: shipTo.country,
        postcode: shipTo.postcode
      },
      packages: packingResult.packages
    });
  } else if (shippingEnv.SHIP_PROVIDER === "EASYPOST") {
    // Use EasyPost
    options = await getEasyPostRates({
      from: {
        country: shippingEnv.SHIP_ORIGIN_COUNTRY,
        postcode: shippingEnv.SHIP_ORIGIN_POSTCODE
      },
      to: {
        country: shipTo.country,
        postcode: shipTo.postcode
      },
      packages: packingResult.packages
    });
  }
  
  // Filter by method preference if specified
  if (methodPref) {
    options = options.filter(option => option.method === methodPref);
  }
  
  // If oversize and no EXPRESS option available, add error handling
  if (packingResult.oversize && !options.some(opt => opt.method === "EXPRESS")) {
    // For oversize items, only allow EXPRESS or contact support
    options = options.filter(opt => opt.method === "EXPRESS");
  }
  
  return {
    options,
    packed: packingResult.packages,
    oversize: packingResult.oversize,
    totalWeightKg: packingResult.totalWeightKg,
    totalDimWeightKg: packingResult.totalDimWeightKg
  };
}

function calculateInhouseOptions(
  zone: string, 
  packingResult: { packages: PackedPackage[]; oversize: boolean }, 
  insuredAmount: number
): QuoteOption[] {
  const options: QuoteOption[] = [];
  
  // Calculate STANDARD rate
  try {
    const standardBreakdown = priceFor({
      zone,
      method: "STANDARD",
      packages: packingResult.packages,
      insuredAmount
    });
    
    options.push({
      method: "STANDARD",
      amount: standardBreakdown.total,
      currency: "EUR",
      etaDays: getEtaDays(zone, "STANDARD"),
      breakdown: standardBreakdown
    });
  } catch (error) {
    // STANDARD not available (e.g., oversize)
  }
  
  // Calculate EXPRESS rate
  try {
    const expressBreakdown = priceFor({
      zone,
      method: "EXPRESS",
      packages: packingResult.packages,
      insuredAmount
    });
    
    options.push({
      method: "EXPRESS",
      amount: expressBreakdown.total,
      currency: "EUR",
      etaDays: getEtaDays(zone, "EXPRESS"),
      breakdown: expressBreakdown
    });
  } catch (error) {
    // EXPRESS not available
  }
  
  return options;
}

function getEtaDays(zone: string, method: "STANDARD" | "EXPRESS"): [number, number] {
  // ETA estimates based on zone and method
  if (zone === "RO") {
    return method === "STANDARD" ? [2, 4] : [1, 2];
  } else if (zone === "EU") {
    return method === "STANDARD" ? [3, 7] : [1, 3];
  } else {
    return method === "STANDARD" ? [7, 14] : [2, 5];
  }
}
