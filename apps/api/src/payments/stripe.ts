import Stripe from "stripe";
import { prisma } from "@artfromromania/db";
import { z } from "zod";
// Temporary tax implementation until package is properly built
// import { 
//   computeTaxForOrder, 
//   resolveDestinationCountry,
//   validateVat,
//   validateVatFallback 
// } from "@artfromromania/tax";

// Temporary tax functions
function resolveDestinationCountry({ digital, shippingAddress, billingAddress }: any): string {
  if (digital) {
    return billingAddress?.country || "RO";
  } else {
    return shippingAddress?.country || billingAddress?.country || "RO";
  }
}

function computeTaxForOrder({ items, shipping, context }: any): any {
  const subtotal = items.reduce((sum: number, item: any) => sum + (item.unitAmount * item.quantity), 0);
  const destinationCountry = context.destinationCountry || context.originCountry;
  
  // Simple tax calculation - 19% for EU countries
  const euCountries = ["RO", "DE", "FR", "IT", "ES", "NL", "BE", "AT", "SE", "DK", "FI", "PL", "CZ", "HU", "SK", "SI", "HR", "BG", "EE", "LV", "LT", "LU", "MT", "CY", "IE", "PT", "GR"];
  const isEU = euCountries.includes(destinationCountry);
  
  if (!isEU) {
    return {
      subtotal,
      tax: 0,
      total: subtotal + shipping,
      lines: items.map((item: any) => ({
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
  const isReverseCharge = isB2B && destinationCountry !== context.originCountry;

  if (isReverseCharge) {
    return {
      subtotal,
      tax: 0,
      total: subtotal + shipping,
      lines: items.map((item: any) => ({
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

  // Regular VAT calculation
  const vatRate = 0.19; // 19% for most EU countries
  let totalTax = 0;
  
  const lines = items.map((item: any) => {
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

async function validateVat(country: string, vatId: string): Promise<any> {
  return { valid: true, checkedAt: new Date() };
}

function validateVatFallback(country: string, vatId: string): any {
  return { valid: true, checkedAt: new Date() };
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

const FLAT_SHIPPING_EUR = parseInt(process.env.FLAT_SHIPPING_EUR || "1500", 10);

interface CreatePaymentIntentPayload {
  cartId: string;
  email?: string;
  shippingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    region?: string;
    postalCode?: string;
    country: string;
    isBusiness?: boolean;
    vatId?: string;
  };
  billingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    region?: string;
    postalCode?: string;
    country: string;
    isBusiness?: boolean;
    vatId?: string;
  };
}

interface CartValidationError {
  type: "original_reserved" | "out_of_stock" | "invalid_item";
  message: string;
  itemId?: string;
}

export async function createPaymentIntent(payload: CreatePaymentIntentPayload) {
  const { cartId, email, shippingAddress, billingAddress } = payload;

  // Get cart with items
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: {
          artwork: {
            include: { artist: true }
          },
          edition: {
            include: { artwork: { include: { artist: true } } }
          }
        }
      }
    }
  });

  if (!cart) {
    throw new Error("Cart not found");
  }

  if (cart.items.length === 0) {
    throw new Error("Cart is empty");
  }

  // Validate cart items and calculate totals
  const validationErrors: CartValidationError[] = [];
  let subtotal = 0;
  let hasDigitalOnly = true;

  for (const item of cart.items) {
    // Re-calculate prices server-side (don't trust client)
    let currentPrice = 0;
    let isAvailable = true;

    if (item.kind === "ORIGINAL") {
      if (!item.artwork) {
        validationErrors.push({
          type: "invalid_item",
          message: "Original artwork not found",
          itemId: item.id
        });
        continue;
      }

      // Check if artwork is still available
      if (item.artwork.status !== "PUBLISHED") {
        validationErrors.push({
          type: "out_of_stock",
          message: "Original artwork is no longer available",
          itemId: item.id
        });
        continue;
      }

      // Check for existing holds
      const existingHold = await prisma.artworkHold.findUnique({
        where: { artworkId: item.artwork.id }
      });

      if (existingHold && existingHold.expiresAt > new Date()) {
        validationErrors.push({
          type: "original_reserved",
          message: "Original artwork is currently reserved",
          itemId: item.id
        });
        continue;
      }

      currentPrice = item.artwork.priceAmount;
      hasDigitalOnly = false;
    } else {
      // EDITIONED or DIGITAL
      if (!item.edition) {
        validationErrors.push({
          type: "invalid_item",
          message: "Edition not found",
          itemId: item.id
        });
        continue;
      }

      if (item.edition.artwork.status !== "PUBLISHED") {
        validationErrors.push({
          type: "out_of_stock",
          message: "Edition is no longer available",
          itemId: item.id
        });
        continue;
      }

      // Check availability for editions
      if (item.edition.available !== null && item.edition.available < item.quantity) {
        validationErrors.push({
          type: "out_of_stock",
          message: `Only ${item.edition.available} items available`,
          itemId: item.id
        });
        continue;
      }

      currentPrice = item.edition.unitAmount;
      if (item.kind === "EDITIONED") {
        hasDigitalOnly = false;
      }
    }

    subtotal += currentPrice * item.quantity;
  }

  if (validationErrors.length > 0) {
    throw new Error(JSON.stringify(validationErrors));
  }

  // Calculate shipping (0 for digital-only orders)
  const shipping = hasDigitalOnly ? 0 : FLAT_SHIPPING_EUR;

  // Calculate tax
  const originCountry = process.env.ORIGIN_COUNTRY || "RO";
  
  // Determine destination country based on product types
  const destinationCountry = resolveDestinationCountry({
    digital: hasDigitalOnly,
    shippingAddress: shippingAddress || undefined,
    billingAddress: billingAddress || undefined
  });

  // Prepare tax context
  const taxContext = {
    originCountry,
    destinationCountry,
    isBusiness: billingAddress?.isBusiness || shippingAddress?.isBusiness,
    vatId: billingAddress?.vatId || shippingAddress?.vatId,
    digital: hasDigitalOnly
  };

  // Validate VAT ID if provided
  if (taxContext.isBusiness && taxContext.vatId) {
    const viesEnabled = process.env.VIES_ENABLED === "true";
    const vatValidation = viesEnabled 
      ? await validateVat(taxContext.destinationCountry, taxContext.vatId)
      : validateVatFallback(taxContext.destinationCountry, taxContext.vatId);

    // Cache VAT validation result
    if (vatValidation.checkedAt) {
      await prisma.vatValidationCache.upsert({
        where: {
          country_vatId: {
            country: taxContext.destinationCountry,
            vatId: taxContext.vatId
          }
        },
        update: {
          valid: vatValidation.valid,
          name: vatValidation.name,
          address: vatValidation.address,
          checkedAt: vatValidation.checkedAt
        },
        create: {
          country: taxContext.destinationCountry,
          vatId: taxContext.vatId,
          valid: vatValidation.valid,
          name: vatValidation.name,
          address: vatValidation.address,
          checkedAt: vatValidation.checkedAt
        }
      });
    }
  }

  // Prepare items for tax calculation
  const taxItems = cart.items.map(item => {
    let description = "";
    if (item.kind === "ORIGINAL") {
      description = `Original artwork: ${item.artwork?.title || "Unknown"}`;
    } else if (item.kind === "EDITIONED") {
      description = `Print edition: ${item.edition?.artwork?.title || "Unknown"}`;
    } else if (item.kind === "DIGITAL") {
      description = `Digital edition: ${item.edition?.artwork?.title || "Unknown"}`;
    }

    return {
      id: item.id,
      kind: item.kind === "ORIGINAL" ? "ORIGINAL" : (item.kind === "EDITIONED" ? "PRINT" : "DIGITAL"),
      quantity: item.quantity,
      unitAmount: item.kind === "ORIGINAL" ? item.artwork!.priceAmount : item.edition!.unitAmount,
      description
    };
  });

  // Calculate tax
  const taxCalculation = computeTaxForOrder({
    items: taxItems,
    shipping,
    context: taxContext
  });

  const totalAmount = taxCalculation.total;

  // Create addresses if provided
  let shippingAddressId: string | undefined;
  let billingAddressId: string | undefined;

  if (shippingAddress) {
    const shippingAddr = await prisma.address.create({
      data: shippingAddress
    });
    shippingAddressId = shippingAddr.id;
  }

  if (billingAddress) {
    const billingAddr = await prisma.address.create({
      data: billingAddress
    });
    billingAddressId = billingAddr.id;
  }

  // Create order
  const order = await prisma.order.create({
    data: {
      buyerId: cart.userId || "anonymous", // TODO: handle anonymous users properly
      status: "PENDING",
      subtotalAmount: taxCalculation.subtotal,
      taxAmount: taxCalculation.tax,
      shippingAmount: shipping,
      totalAmount,
      currency: cart.currency,
      paymentProvider: "STRIPE",
      shippingAddressId,
      billingAddressId
    }
  });

  // Create order items
  for (const item of cart.items) {
    let unitAmount = 0;
    let kind: "ORIGINAL" | "PRINT" | "DIGITAL";

    if (item.kind === "ORIGINAL") {
      unitAmount = item.artwork!.priceAmount;
      kind = "ORIGINAL";
    } else {
      unitAmount = item.edition!.unitAmount;
      kind = item.edition!.type === "PRINT" ? "PRINT" : "DIGITAL";
    }

    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        artistId: item.artistId,
        kind,
        artworkId: item.artworkId,
        editionId: item.editionId,
        quantity: item.quantity,
        unitAmount,
        subtotal: unitAmount * item.quantity
      }
    });
  }

  // Create holds for ORIGINAL items
  for (const item of cart.items) {
    if (item.kind === "ORIGINAL" && item.artwork) {
      await prisma.artworkHold.upsert({
        where: { artworkId: item.artwork.id },
        update: {
          orderId: order.id,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
        },
        create: {
          artworkId: item.artwork.id,
          orderId: order.id,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
        }
      });
    }
  }

  // Create Stripe PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmount,
    currency: cart.currency.toLowerCase(),
    metadata: {
      orderId: order.id,
      userId: cart.userId || "anonymous"
    },
    automatic_payment_methods: {
      enabled: true
    },
    receipt_email: email,
    description: `Order ${order.id} - RomArt`
  });

  // Update order with payment intent ID
  await prisma.order.update({
    where: { id: order.id },
    data: { providerIntentId: paymentIntent.id }
  });

  return {
    clientSecret: paymentIntent.client_secret,
    orderId: order.id,
    taxBreakdown: {
      subtotal: taxCalculation.subtotal,
      tax: taxCalculation.tax,
      shipping,
      total: totalAmount,
      reverseCharge: taxCalculation.reverseCharge,
      notes: taxCalculation.notes
    }
  };
}

export async function cancelPaymentIntent(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true }
  });

  if (!order || !order.providerIntentId) {
    throw new Error("Order not found or no payment intent");
  }

  // Cancel Stripe PaymentIntent
  await stripe.paymentIntents.cancel(order.providerIntentId);

  // Release holds
  await prisma.artworkHold.deleteMany({
    where: { orderId }
  });

  // Update order status
  await prisma.order.update({
    where: { id: orderId },
    data: { status: "CANCELLED" }
  });

  return true;
}

export async function handlePaymentSuccess(paymentIntentId: string) {
  const order = await prisma.order.findFirst({
    where: { providerIntentId: paymentIntentId },
    include: {
      items: {
        include: {
          artwork: true,
          edition: true
        }
      }
    }
  });

  if (!order) {
    throw new Error("Order not found");
  }

  // Process each item
  for (const item of order.items) {
    if (item.kind === "ORIGINAL" && item.artwork) {
      // Mark original as sold
      await prisma.artwork.update({
        where: { id: item.artwork.id },
        data: { status: "SOLD" }
      });

      // Remove hold
      await prisma.artworkHold.delete({
        where: { artworkId: item.artwork.id }
      });
    } else if (item.edition) {
      // Decrement edition availability
      if (item.edition.available !== null) {
        await prisma.edition.update({
          where: { id: item.edition.id },
          data: {
            available: Math.max(0, item.edition.available - item.quantity)
          }
        });
      }

      // Create digital entitlements for digital editions
      if (item.edition.type === "DIGITAL") {
        const maxDownloads = parseInt(process.env.DOWNLOAD_MAX_TIMES || "5", 10);
        const expiresInYears = 1; // 1 year expiration
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + expiresInYears);

        for (let i = 0; i < item.quantity; i++) {
          const cuid = (await import("cuid")).default;
          const { randomBytes } = await import("crypto");
          
          const token = `${cuid()}${randomBytes(8).toString('hex')}`;
          
          await prisma.digitalEntitlement.create({
            data: {
              orderId: order.id,
              userId: order.buyerId,
              editionId: item.edition.id,
              token,
              maxDownloads,
              expiresAt
            }
          });
        }
      }
    }
  }

  // Update order status
  await prisma.order.update({
    where: { id: order.id },
    data: { status: "PAID" }
  });

  // Generate invoice
  try {
    const { generateInvoiceForOrder } = await import("../invoices/service");
    await generateInvoiceForOrder(order.id);
  } catch (error) {
    console.error("Failed to generate invoice:", error);
    // Don't fail the payment if invoice generation fails
  }

  // Clear cart if user has one
  if (order.buyerId !== "anonymous") {
    await prisma.cartItem.deleteMany({
      where: {
        cart: {
          userId: order.buyerId
        }
      }
    });
  }

  return order;
}

export async function handlePaymentFailure(paymentIntentId: string) {
  const order = await prisma.order.findFirst({
    where: { providerIntentId: paymentIntentId }
  });

  if (!order) {
    throw new Error("Order not found");
  }

  // Release holds
  await prisma.artworkHold.deleteMany({
    where: { orderId: order.id }
  });

  // Update order status
  await prisma.order.update({
    where: { id: order.id },
    data: { status: "FAILED" }
  });

  return order;
}

export { stripe };
