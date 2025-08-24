import { PackedPackage, QuoteOption } from "../types";

export interface EasyPostRateRequest {
  from: {
    country: string;
    postcode: string;
  };
  to: {
    country: string;
    postcode?: string;
  };
  packages: PackedPackage[];
}

export async function getRates(request: EasyPostRateRequest): Promise<QuoteOption[]> {
  // TODO: Implement actual EasyPost integration
  // For now, return stub rates similar to Shippo
  
  const { to } = request;
  
  // Stub rates based on destination
  const isEU = ["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE"].includes(to.country);
  const isRO = to.country === "RO";
  
  if (isRO) {
    return [
      {
        method: "STANDARD",
        serviceName: "Romanian Post",
        amount: 1500,
        currency: "EUR",
        etaDays: [2, 4]
      },
      {
        method: "EXPRESS",
        serviceName: "FedEx Express",
        amount: 2500,
        currency: "EUR",
        etaDays: [1, 2]
      }
    ];
  } else if (isEU) {
    return [
      {
        method: "STANDARD",
        serviceName: "FedEx International Economy",
        amount: 3000,
        currency: "EUR",
        etaDays: [3, 7]
      },
      {
        method: "EXPRESS",
        serviceName: "FedEx International Priority",
        amount: 6000,
        currency: "EUR",
        etaDays: [1, 3]
      }
    ];
  } else {
    return [
      {
        method: "STANDARD",
        serviceName: "FedEx International Economy",
        amount: 5000,
        currency: "EUR",
        etaDays: [7, 14]
      },
      {
        method: "EXPRESS",
        serviceName: "FedEx International Priority",
        amount: 9000,
        currency: "EUR",
        etaDays: [2, 5]
      }
    ];
  }
}
