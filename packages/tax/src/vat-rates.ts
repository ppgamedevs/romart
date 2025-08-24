// EU VAT rates (standard rates as of 2024)
export const EU_VAT_RATES: Record<string, number> = {
  // Major EU countries
  "RO": 0.19, // Romania
  "DE": 0.19, // Germany
  "FR": 0.20, // France
  "IT": 0.22, // Italy
  "ES": 0.21, // Spain
  "NL": 0.21, // Netherlands
  "BE": 0.21, // Belgium
  "AT": 0.20, // Austria
  "SE": 0.25, // Sweden
  "DK": 0.25, // Denmark
  "FI": 0.24, // Finland
  "PL": 0.23, // Poland
  "CZ": 0.21, // Czech Republic
  "HU": 0.27, // Hungary
  "SK": 0.20, // Slovakia
  "SI": 0.22, // Slovenia
  "HR": 0.25, // Croatia
  "BG": 0.20, // Bulgaria
  "EE": 0.20, // Estonia
  "LV": 0.21, // Latvia
  "LT": 0.21, // Lithuania
  "LU": 0.17, // Luxembourg
  "MT": 0.18, // Malta
  "CY": 0.19, // Cyprus
  "IE": 0.23, // Ireland
  "PT": 0.23, // Portugal
  "GR": 0.24, // Greece
};

// EU country codes
export const EU_COUNTRIES = Object.keys(EU_VAT_RATES);

// Check if a country is in the EU
export function isEUCountry(country: string): boolean {
  return EU_COUNTRIES.includes(country.toUpperCase());
}

// Get VAT rate for a country
export function getVatRate(country: string): number {
  const upperCountry = country.toUpperCase();
  return EU_VAT_RATES[upperCountry] || 0;
}
