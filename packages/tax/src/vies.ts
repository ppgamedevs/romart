import fetch from "node-fetch";
import { VatValidationResult, VatValidationSchema } from "./types";

// VIES (VAT Information Exchange System) validation
export async function validateVat(country: string, vatId: string): Promise<VatValidationResult> {
  try {
    // Validate input
    const validated = VatValidationSchema.parse({ country, vatId });
    
    // Clean VAT ID (remove country prefix if present)
    const cleanVatId = validated.vatId.replace(new RegExp(`^${validated.country}`, 'i'), '');
    
    // Use a VIES proxy service (simplified implementation)
    // In production, you might want to use a more reliable service
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`https://api.vatsensing.com/1.0/validate/${validated.country}/${cleanVatId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'RomArt/1.0'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`VIES validation failed for ${validated.country}${cleanVatId}: ${response.status}`);
      return {
        valid: false,
        checkedAt: new Date()
      };
    }

    const data = await response.json() as any;
    
    return {
      valid: data.valid === true,
      name: data.name || undefined,
      address: data.address || undefined,
      checkedAt: new Date()
    };
  } catch (error) {
    console.error('VIES validation error:', error);
    return {
      valid: false,
      checkedAt: new Date()
    };
  }
}

// Fallback validation for testing/development
export function validateVatFallback(country: string, vatId: string): VatValidationResult {
  // Simple validation for common patterns
  const cleanVatId = vatId.replace(new RegExp(`^${country}`, 'i'), '');
  
  // Basic format validation for some countries
  const patterns: Record<string, RegExp> = {
    'RO': /^\d{2,10}$/, // Romania: 2-10 digits
    'DE': /^\d{9}$/,    // Germany: 9 digits
    'FR': /^[A-Z0-9]{2}\d{9}$/, // France: 2 letters/numbers + 9 digits
    'IT': /^\d{11}$/,   // Italy: 11 digits
    'ES': /^[A-Z0-9]\d{7}[A-Z0-9]$/, // Spain: 1 letter/number + 7 digits + 1 letter/number
  };

  const pattern = patterns[country.toUpperCase()];
  const isValid = pattern ? pattern.test(cleanVatId) : cleanVatId.length >= 3;

  return {
    valid: isValid,
    checkedAt: new Date()
  };
}
