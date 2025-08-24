export function formatMinor(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("en", { 
    style: "currency", 
    currency 
  }).format(amount / 100);
}
