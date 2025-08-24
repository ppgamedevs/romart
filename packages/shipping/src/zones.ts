import { rateTableConfig } from "./env";

export function zoneFor(country: string): string {
  const zones = rateTableConfig.zones || [];
  
  for (const zone of zones) {
    if (zone.countries.includes("*")) {
      return zone.id; // International zone
    }
    if (zone.countries.includes(country.toUpperCase())) {
      return zone.id;
    }
  }
  
  // Default to international if country not found
  return "INTL";
}

export function getZoneCountries(zoneId: string): string[] {
  const zones = rateTableConfig.zones || [];
  const zone = zones.find((z: any) => z.id === zoneId);
  return zone?.countries || [];
}
