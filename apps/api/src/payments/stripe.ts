import Stripe from "stripe";
import { prisma } from "@artfromromania/db";
import { z } from "zod";
// import { 
//   createTransferToArtist, 
//   calculateArtistShare, 
//   getPayoutDelayDays 
// } from "./connect";
import { 
  createPayout, 
  updatePayoutStatus, 
  getPayoutsByOrderId 
} from "@artfromromania/db";
// import { 
//   quoteOriginal, 
//   type Packable 
// } from "@artfromromania/shipping";

// Temporary implementations until shipping package is ready
type Packable = any;

async function quoteOriginal(options: any): Promise<any> {
  // Temporary shipping quote implementation
  return {
    cost: 1500, // 15 EUR in cents
    currency: "EUR",
    estimatedDays: 5,
    service: "standard"
  };
}
// Temporary tax implementation until package is properly built
// import { 
//   computeTaxForOrder, 
//   resolveDestinationCountry,
//   validateVat,
//   validateVatFallback 
// } from "@artfromromania/tax";

// Missing functions that were commented out
function calculateArtistShare(subtotal: number, platformFeeBps: number): number {
  const platformFee = Math.round(subtotal * platformFeeBps / 10000);
  return subtotal - platformFee;
}

function getPayoutDelayDays(): number {
  return parseInt(process.env.PAYOUT_DELAY_DAYS || "7");
}

async function createTransferToArtist(
  artistId: string, 
  amount: number, 
  currency: string, 
  orderId: string, 
  description: string
): Promise<any> {
  // This would integrate with Stripe Connect for actual transfers
  // For now, return a mock transfer object
  return {
    id: `tr_${Date.now()}_${artistId}`,
    amount,
    currency,
    status: "pending"
  };
}

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

// Initialize Stripe only if API key is available
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-07-30.basil",
    })
  : null;

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

  // Calculate shipping
  let shipping = 0;
  let shippingMethod = null;
  let shippingServiceName = null;
  let originalShippingQuote = null;

  if (!hasDigitalOnly) {
    // Separate items by type
    const printItems = cart.items.filter(item => item.kind === "EDITIONED");
    const originalItems = cart.items.filter(item => item.kind === "ORIGINAL");
    
    // Calculate PoD shipping (from Prompt 14)
    let podShipping = 0;
    if (printItems.length > 0) {
      // TODO: Integrate with PoD shipping from Prompt 14
      // For now, use flat rate
      podShipping = FLAT_SHIPPING_EUR;
    }
    
    // Calculate Original shipping
    if (originalItems.length > 0 && shippingAddress) {
      try {
        // Prepare packable items for shipping calculation
        const packableItems: Packable[] = originalItems.map(item => {
          if (!item.artwork) {
            throw new Error(`Artwork not found for item ${item.id}`);
          }
          
          return {
            orderItemId: item.id,
            kind: "ORIGINAL",
            qty: item.quantity,
            widthCm: item.artwork.widthCm?.toNumber() || 0,
            heightCm: item.artwork.heightCm?.toNumber() || 0,
            depthCm: item.artwork.depthCm?.toNumber() || 0,
            framed: item.artwork.framed,
            weightKg: undefined, // Will be estimated by packer
            preferred: item.artwork.framed ? "BOX" : "TUBE",
            unitAmount: item.artwork.priceAmount
          };
        });
        
        // Get shipping quote
        originalShippingQuote = await quoteOriginal({
          items: packableItems,
          shipTo: {
            country: shippingAddress.country,
            postcode: shippingAddress.postalCode,
            city: shippingAddress.city,
            state: shippingAddress.region
          }
        });
        
        // Use STANDARD method by default
        const standardOption = originalShippingQuote.options.find((opt: any) => opt.method === "STANDARD");
        if (standardOption) {
          shippingMethod = "STANDARD";
          shippingServiceName = standardOption.serviceName;
          shipping = podShipping + standardOption.amount;
        } else {
          // Fallback to EXPRESS if STANDARD not available
          const expressOption = originalShippingQuote.options.find((opt: any) => opt.method === "EXPRESS");
          if (expressOption) {
            shippingMethod = "EXPRESS";
            shippingServiceName = expressOption.serviceName;
            shipping = podShipping + expressOption.amount;
          } else {
            throw new Error("No shipping options available");
          }
        }
      } catch (error) {
        console.error("Shipping calculation failed:", error);
        // Fallback to flat shipping
        shipping = FLAT_SHIPPING_EUR;
      }
    } else {
      // Fallback to flat shipping
      shipping = FLAT_SHIPPING_EUR;
    }
  }

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
      data: {
        type: "SHIPPING",
        firstName: "User", // Default values - should be provided by client
        lastName: "Name",
        addressLine1: shippingAddress.line1,
        addressLine2: shippingAddress.line2,
        city: shippingAddress.city,
        region: shippingAddress.region,
        postalCode: shippingAddress.postalCode || "",
        country: shippingAddress.country,
        isBusiness: shippingAddress.isBusiness,
        vatId: shippingAddress.vatId
      }
    });
    shippingAddressId = shippingAddr.id;
  }

  if (billingAddress) {
    const billingAddr = await prisma.address.create({
      data: {
        type: "BILLING",
        firstName: "User", // Default values - should be provided by client
        lastName: "Name",
        addressLine1: billingAddress.line1,
        addressLine2: billingAddress.line2,
        city: billingAddress.city,
        region: billingAddress.region,
        postalCode: billingAddress.postalCode || "",
        country: billingAddress.country,
        isBusiness: billingAddress.isBusiness,
        vatId: billingAddress.vatId
      }
    });
    billingAddressId = billingAddr.id;
  }

  // Create order
  const orderData: any = {
    buyerId: cart.userId || "anonymous", // TODO: handle anonymous users properly
    status: "PENDING",
    subtotalAmount: taxCalculation.subtotal,
    taxAmount: taxCalculation.tax,
    shippingAmount: shipping,
    totalAmount,
    currency: cart.currency,
    paymentProvider: "STRIPE",
    shippingMethod,
    shippingServiceName
  };

  if (shippingAddressId) {
    orderData.shippingAddressId = shippingAddressId;
  }

  if (billingAddressId) {
    orderData.billingAddressId = billingAddressId;
  }

  const order = await prisma.order.create({
    data: orderData
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
  if (!stripe) {
    throw new Error("Stripe not configured");
  }
  
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
  if (!stripe) {
    throw new Error("Stripe not configured");
  }
  
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

  // Process payouts to artists
  await processArtistPayouts(order);

  // Process fulfillment for PRINT items
  try {
    const { processFulfillmentForOrder } = await import("../fulfillment/service");
    await processFulfillmentForOrder(order.id);
  } catch (error) {
    console.error("Failed to process fulfillment:", error);
    // Don't fail the payment if fulfillment processing fails
  }

  // Create shipments for ORIGINAL items
  try {
    await createShipmentsForOrder(order);
  } catch (error) {
    console.error("Failed to create shipments:", error);
    // Don't fail the payment if shipment creation fails
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

async function createShipmentsForOrder(order: any) {
  // Get original items from the order
  const originalItems = order.items.filter((item: any) => item.kind === "ORIGINAL");
  
  if (originalItems.length === 0) {
    return; // No original items to ship
  }

  // Get shipping address
  if (!order.shippingAddress) {
    console.warn("No shipping address for order", order.id);
    return;
  }

  try {
    // Prepare packable items for shipping calculation
    const packableItems: Packable[] = originalItems.map((item: any) => {
      if (!item.artwork) {
        throw new Error(`Artwork not found for item ${item.id}`);
      }
      
      return {
        orderItemId: item.id,
        kind: "ORIGINAL",
        qty: item.quantity,
        widthCm: item.artwork.widthCm?.toNumber() || 0,
        heightCm: item.artwork.heightCm?.toNumber() || 0,
        depthCm: item.artwork.depthCm?.toNumber() || 0,
        framed: item.artwork.framed,
        weightKg: undefined, // Will be estimated by packer
        preferred: item.artwork.framed ? "BOX" : "TUBE",
        unitAmount: item.artwork.priceAmount
      };
    });

    // Get shipping quote (idempotent - same result as during checkout)
    const shippingQuote = await quoteOriginal({
      items: packableItems,
      shipTo: {
        country: order.shippingAddress.country,
        postcode: order.shippingAddress.postalCode,
        city: order.shippingAddress.city,
        state: order.shippingAddress.region
      }
    });

    // Calculate insured amount
    const insuredAmount = Math.min(
      order.totalAmount,
      originalItems.reduce((sum: number, item: any) => sum + (item.artwork?.priceAmount || 0), 0)
    );

    // Create shipment
    const shipment = await prisma.shipment.create({
      data: {
        orderId: order.id,
        method: order.shippingMethod || "STANDARD",
        provider: process.env.SHIP_PROVIDER || "INHOUSE",
        serviceName: order.shippingServiceName,
        zone: shippingQuote.options[0]?.breakdown ? "calculated" : undefined,
        insuredAmount,
        currency: "EUR",
        status: "READY_TO_SHIP"
      }
    });

    // Create shipment packages
    for (const pkg of shippingQuote.packed) {
      await prisma.shipmentPackage.create({
        data: {
          shipmentId: shipment.id,
          kind: pkg.kind,
          refId: pkg.refId,
          lengthCm: pkg.lengthCm,
          widthCm: pkg.widthCm,
          heightCm: pkg.heightCm,
          diameterCm: pkg.diameterCm,
          weightKg: pkg.weightKg,
          dimWeightKg: pkg.dimWeightKg,
          items: pkg.items
        }
      });
    }

    console.log(`Created shipment ${shipment.id} with ${shippingQuote.packed.length} packages for order ${order.id}`);
  } catch (error) {
    console.error("Failed to create shipments for order", order.id, error);
    throw error;
  }
}

async function processArtistPayouts(order: any) {
  // Group items by artist and calculate payouts
  const artistPayouts = new Map<string, { amount: number; items: any[] }>();

  for (const item of order.items) {
    const artistId = item.artistId;
    const subtotal = item.subtotal;
    const artistShare = calculateArtistShare(subtotal, order.platformFeeBps);

    if (!artistPayouts.has(artistId)) {
      artistPayouts.set(artistId, { amount: 0, items: [] });
    }

    const payout = artistPayouts.get(artistId)!;
    payout.amount += artistShare;
    payout.items.push(item);
  }

  // Process payouts for each artist
  for (const [artistId, payout] of artistPayouts) {
    const payoutDelayDays = getPayoutDelayDays();
    const availableAt = payoutDelayDays > 0 
      ? new Date(Date.now() + payoutDelayDays * 24 * 60 * 60 * 1000)
      : undefined;

    // Create payout records for each item
    for (const item of payout.items) {
      const artistShare = calculateArtistShare(item.subtotal, order.platformFeeBps);
      
      await createPayout(prisma, {
        artistId,
        orderItemId: item.id,
        amount: artistShare,
        currency: order.currency,
        availableAt,
      });
    }

    // If no delay, process transfer immediately
    if (payoutDelayDays === 0) {
      try {
        const transfer = await createTransferToArtist(
          artistId,
          payout.amount,
          order.currency,
          order.id,
          `RomArt order ${order.id}`
        );

        // Update payout records with transfer ID
        for (const item of payout.items) {
          const artistShare = calculateArtistShare(item.subtotal, order.platformFeeBps);
          
          await updatePayoutStatus(
            prisma,
            (await prisma.payout.findFirst({
              where: {
                artistId,
                orderItemId: item.id,
                amount: artistShare,
              }
            }))!.id,
            "PAID",
            transfer.id
          );
        }
      } catch (error) {
        console.error(`Failed to create transfer for artist ${artistId}:`, error);
        // Payouts remain PENDING and will be retried later
      }
    }
  }
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
