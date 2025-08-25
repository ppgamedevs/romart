export type Currency = 'EUR' | 'USD' | 'RON';

export type Rates = Record<string, number>;

let cache: { ts: number; rates: Rates } | null = null;

export async function getRates(): Promise<Rates> {
  const now = Date.now();
  if (cache && now - cache.ts < Number(process.env.FX_REFRESH_MINUTES||60)*60_000) {
    return cache.rates;
  }

  const base = process.env.FX_BASE || 'EUR';
  let rates: Rates;

  if (process.env.FX_PROVIDER === 'OPENEX') {
    // Stub for OpenExchangeRates integration
    const appId = process.env.OPENEX_APP_ID;
    if (!appId) {
      console.warn('OPENEX_APP_ID not configured, using fallback rates');
      rates = { USD: 1.1, RON: 4.5 };
    } else {
      try {
        const response = await fetch(`https://openexchangerates.org/api/latest.json?app_id=${appId}&base=${base}`);
        const data = await response.json() as { rates: Record<string, number> };
        rates = data.rates;
      } catch (error) {
        console.error('Failed to fetch rates from OpenExchangeRates:', error);
        rates = { USD: 1.1, RON: 4.5 };
      }
    }
  } else {
    // Stub for ECB integration
    try {
      // In a real implementation, you'd fetch from ECB XML or use a cached service
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
      const data = await response.json() as { rates: Record<string, number> };
      rates = data.rates;
    } catch (error) {
      console.error('Failed to fetch rates from ECB:', error);
      rates = { USD: 1.1, RON: 4.5 };
    }
  }

  cache = { ts: now, rates };
  return rates;
}

export function convert(
  amountMinor: number,
  from: Currency,
  to: Currency,
  rates: Rates
): number {
  if (from === to) return amountMinor;

  const base = (process.env.FX_BASE || 'EUR') as Currency;
  const toPerBase = to === base ? 1 : rates[to];
  const fromPerBase = from === base ? 1 : rates[from];

  if (!toPerBase || !fromPerBase) {
    throw new Error(`Invalid exchange rates for ${from} or ${to}`);
  }

  const eur = from === 'EUR' ? amountMinor : Math.round(amountMinor / fromPerBase);
  let out = to === 'EUR' ? eur : Math.round(eur * toPerBase);

  // Apply markup
  const bps = Number(process.env.CURRENCY_MARKUP_BPS || 0);
  out = Math.round(out * (1 + bps / 10_000));

  // Apply rounding rule
  const rule = process.env.CURRENCY_ROUNDING_RULE || 'NEAREST';
  if (rule === 'PSYCHO') {
    out = psychoRound(out, to);
  } else if (rule === 'FLOOR') {
    out = Math.floor(out);
  } else if (rule === 'CEIL') {
    out = Math.ceil(out);
  }
  // NEAREST is default behavior

  return out;
}

function psychoRound(amount: number, currency: Currency): number {
  // Psychological pricing: end with 9 or 99
  const lastDigit = amount % 10;
  const lastTwoDigits = amount % 100;

  if (currency === 'RON') {
    // For RON, prefer ending with 9
    if (lastDigit >= 5) {
      return amount + (10 - lastDigit) - 1; // Round up to next 10, then subtract 1
    } else {
      return amount - lastDigit + 9; // Round down to previous 10, then add 9
    }
  } else {
    // For EUR/USD, prefer ending with 99
    if (lastTwoDigits >= 50) {
      return amount + (100 - lastTwoDigits) - 1; // Round up to next 100, then subtract 1
    } else {
      return amount - lastTwoDigits + 99; // Round down to previous 100, then add 99
    }
  }
}

export function formatCurrency(
  amountMinor: number,
  currency: Currency,
  locale: string = 'en'
): string {
  const amount = amountMinor / 100;
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getSupportedCurrencies(): Currency[] {
  return (process.env.SUPPORTED_CURRENCIES || 'EUR,RON,USD')
    .split(',')
    .map(c => c.trim() as Currency);
}

export function getDefaultCurrency(): Currency {
  return (process.env.DEFAULT_CURRENCY || 'EUR') as Currency;
}
