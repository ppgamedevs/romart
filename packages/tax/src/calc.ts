import { TaxContext, TaxCalculation, OrderItem, Address } from "./types";
import { EU_COUNTRIES, isEUCountry, getVatRate } from "./vat-rates";

// Determine destination country based on product type and addresses
export function resolveDestinationCountry({
  digital,
  shippingAddress,
  billingAddress
}: {
  digital: boolean;
  shippingAddress?: Address;
  billingAddress?: Address;
}): string {
  if (digital) {
    // For digital products, use billing address country
    return billingAddress?.country || "RO";
  } else {
    // For physical products, use shipping address country
    return shippingAddress?.country || billingAddress?.country || "RO";
  }
}

// Calculate tax for an order
export function computeTaxForOrder({
  items,
  shipping,
  context
}: {
  items: OrderItem[];
  shipping: number;
  context: TaxContext;
}): TaxCalculation {
  const subtotal = items.reduce((sum, item) => sum + (item.unitAmount * item.quantity), 0);
  
  // Determine destination country
  const destinationCountry = context.destinationCountry || context.originCountry;
  
  // Check if it's outside EU
  if (!isEUCountry(destinationCountry)) {
    return {
      subtotal,
      tax: 0,
      total: subtotal + shipping,
      lines: items.map(item => ({
        itemId: item.id,
        description: item.description,
        quantity: item.quantity,
        unitAmount: item.unitAmount,
        taxRate: 0,
        taxAmount: 0,
        totalAmount: item.unitAmount * item.quantity
      })),
      reverseCharge: false,
      notes: "Outside scope of EU VAT"
    };
  }

  // Check for B2B reverse charge
  const isB2B = context.isBusiness && context.vatId;
  const isReverseCharge = isB2B && 
    destinationCountry !== context.originCountry && 
    isEUCountry(destinationCountry);

  if (isReverseCharge) {
    return {
      subtotal,
      tax: 0,
      total: subtotal + shipping,
      lines: items.map(item => ({
        itemId: item.id,
        description: item.description,
        quantity: item.quantity,
        unitAmount: item.unitAmount,
        taxRate: 0,
        taxAmount: 0,
        totalAmount: item.unitAmount * item.quantity
      })),
      reverseCharge: true,
      notes: "VAT reverse charge under Article 196 of Directive 2006/112/EC"
    };
  }

  // Regular B2C or B2B same country - apply VAT
  const vatRate = getVatRate(destinationCountry);
  let totalTax = 0;
  
  const lines = items.map(item => {
    const lineTotal = item.unitAmount * item.quantity;
    const lineTax = Math.round(lineTotal * vatRate);
    totalTax += lineTax;
    
    return {
      itemId: item.id,
      description: item.description,
      quantity: item.quantity,
      unitAmount: item.unitAmount,
      taxRate: vatRate,
      taxAmount: lineTax,
      totalAmount: lineTotal + lineTax
    };
  });

  return {
    subtotal,
    tax: totalTax,
    total: subtotal + totalTax + shipping,
    lines,
    reverseCharge: false
  };
}

// Helper function to round to nearest cent (for minor units)
export function roundToMinorUnits(amount: number): number {
  return Math.round(amount);
}

// Format VAT rate as percentage
export function formatVatRate(rate: number): string {
  return `${(rate * 100).toFixed(0)}%`;
}
