import Stripe from "stripe";
import { z } from "zod";
import { prisma } from "@artfromromania/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

// Environment validation
const connectConfig = z.object({
  STRIPE_CONNECT_CLIENT_ID: z.string(),
  CONNECT_ONBOARDING_RETURN_URL: z.string().url(),
  CONNECT_ONBOARDING_REFRESH_URL: z.string().url(),
  CONNECT_PLATFORM_FEE_BPS: z.string().transform((val) => parseInt(val, 10)),
  CONNECT_PAYOUT_DELAY_DAYS: z.string().transform((val) => parseInt(val, 10)),
  STRIPE_PLATFORM_FEE_BPS: z.string().transform((val) => parseInt(val, 10)),
}).parse({
  STRIPE_CONNECT_CLIENT_ID: process.env.STRIPE_CONNECT_CLIENT_ID,
  CONNECT_ONBOARDING_RETURN_URL: process.env.CONNECT_ONBOARDING_RETURN_URL,
  CONNECT_ONBOARDING_REFRESH_URL: process.env.CONNECT_ONBOARDING_REFRESH_URL,
  CONNECT_PLATFORM_FEE_BPS: process.env.CONNECT_PLATFORM_FEE_BPS || "3000",
  CONNECT_PAYOUT_DELAY_DAYS: process.env.CONNECT_PAYOUT_DELAY_DAYS || "0",
  STRIPE_PLATFORM_FEE_BPS: process.env.STRIPE_PLATFORM_FEE_BPS || "1500",
});

export interface StripeAccount {
  id: string;
  payouts_enabled: boolean;
  requirements: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
    disabled_reason: string | null;
  };
  charges_enabled: boolean;
  country: string;
  default_currency: string;
}

// =============================================================================
// Artist Connect Functions (existing)
// =============================================================================

export async function getOrCreateStripeAccount(artistId: string): Promise<StripeAccount> {
  
  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    select: { 
      id: true, 
      stripeAccountId: true, 
      locationCountry: true,
      user: { select: { email: true } }
    }
  });

  if (!artist) {
    throw new Error("Artist not found");
  }

  // If artist already has a Stripe account, return it
  if (artist.stripeAccountId) {
    try {
      const account = await stripe.accounts.retrieve(artist.stripeAccountId) as StripeAccount;
      return account;
    } catch (error) {
      console.error("Failed to retrieve existing Stripe account:", error);
      // If account doesn't exist or is invalid, we'll create a new one
    }
  }

  // Create new Stripe Express account
  const account = await stripe.accounts.create({
    type: "express",
    country: artist.locationCountry || "RO",
    email: artist.user?.email || "artist@romart.com", // Fallback email
    capabilities: {
      transfers: { requested: true },
      card_payments: { requested: true },
    },
    business_type: "individual",
    tos_acceptance: {
      date: Math.floor(Date.now() / 1000),
      ip: "127.0.0.1", // Will be updated during onboarding
    },
  }) as StripeAccount;

  // Save the account ID to the artist
  await prisma.artist.update({
    where: { id: artistId },
    data: { 
      stripeAccountId: account.id,
      connectStatus: "onboarding_required"
    }
  });

  return account;
}

export async function createOnboardingLink(artistId: string): Promise<string> {
  const account = await getOrCreateStripeAccount(artistId);

  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    type: "account_onboarding",
    refresh_url: connectConfig.CONNECT_ONBOARDING_REFRESH_URL,
    return_url: connectConfig.CONNECT_ONBOARDING_RETURN_URL,
  });

  return accountLink.url;
}

export async function getLoginLink(artistId: string): Promise<string> {
  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    select: { stripeAccountId: true }
  });

  if (!artist?.stripeAccountId) {
    throw new Error("Artist has no Stripe account");
  }

  const loginLink = await stripe.accounts.createLoginLink(artist.stripeAccountId);
  return loginLink.url;
}

export async function refreshAccountStatus(artistId: string): Promise<void> {
  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    select: { stripeAccountId: true }
  });

  if (!artist?.stripeAccountId) {
    throw new Error("Artist has no Stripe account");
  }

  const account = await stripe.accounts.retrieve(artist.stripeAccountId) as StripeAccount;

  // Determine connect status
  let connectStatus = "complete";
  if (!account.charges_enabled) {
    connectStatus = "onboarding_required";
  } else if (account.requirements.currently_due.length > 0) {
    connectStatus = "requirements_pending";
  } else if (account.requirements.past_due.length > 0) {
    connectStatus = "restricted";
  }

  // Update artist record
  await prisma.artist.update({
    where: { id: artistId },
    data: {
      payoutsEnabled: account.payouts_enabled,
      connectStatus,
      connectRequirements: account.requirements,
    }
  });
}

export async function createTransferToArtist(
  artistId: string, 
  amount: number, 
  currency: string, 
  orderId: string,
  description?: string
): Promise<Stripe.Transfer> {
  
  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    select: { stripeAccountId: true }
  });

  if (!artist?.stripeAccountId) {
    throw new Error("Artist has no Stripe account");
  }

  // Calculate platform fee
  const platformFee = Math.round(amount * (connectConfig.CONNECT_PLATFORM_FEE_BPS / 10000));
  const transferAmount = amount - platformFee;

  const transfer = await stripe.transfers.create({
    amount: transferAmount,
    currency: currency.toLowerCase(),
    destination: artist.stripeAccountId,
    description: description || `Payout for order ${orderId}`,
    metadata: {
      orderId,
      artistId,
      platformFee: platformFee.toString(),
      platformFeeBps: connectConfig.CONNECT_PLATFORM_FEE_BPS.toString(),
    },
  });

  return transfer;
}

// =============================================================================
// Partner/Affiliate Connect Functions (new)
// =============================================================================

export async function getOrCreatePartnerStripeAccount(partnerId: string): Promise<StripeAccount> {
  
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    select: { 
      id: true, 
      connectId: true, 
      name: true,
      user: { select: { email: true } }
    }
  });

  if (!partner) {
    throw new Error("Partner not found");
  }

  // If partner already has a Stripe account, return it
  if (partner.connectId) {
    try {
      const account = await stripe.accounts.retrieve(partner.connectId) as StripeAccount;
      return account;
    } catch (error) {
      console.error("Failed to retrieve existing partner Stripe account:", error);
      // If account doesn't exist or is invalid, we'll create a new one
    }
  }

  // Create new Stripe Express account for partner
  const account = await stripe.accounts.create({
    type: "express",
    country: "RO", // Default to Romania for affiliates
    email: partner.user?.email || `${partner.name.toLowerCase().replace(/\s+/g, '.')}@romart.com`,
    capabilities: {
      transfers: { requested: true },
      card_payments: { requested: true },
    },
    business_type: "individual",
    tos_acceptance: {
      date: Math.floor(Date.now() / 1000),
      ip: "127.0.0.1", // Will be updated during onboarding
    },
  }) as StripeAccount;

  // Save the account ID to the partner
  await prisma.partner.update({
    where: { id: partnerId },
    data: { 
      connectId: account.id
    }
  });

  return account;
}

export async function createPartnerOnboardingLink(partnerId: string): Promise<string> {
  const account = await getOrCreatePartnerStripeAccount(partnerId);

  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    type: "account_onboarding",
    refresh_url: connectConfig.CONNECT_ONBOARDING_REFRESH_URL,
    return_url: connectConfig.CONNECT_ONBOARDING_RETURN_URL,
  });

  return accountLink.url;
}

export async function getPartnerLoginLink(partnerId: string): Promise<string> {
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    select: { connectId: true }
  });

  if (!partner?.connectId) {
    throw new Error("Partner has no Stripe account");
  }

  const loginLink = await stripe.accounts.createLoginLink(partner.connectId);
  return loginLink.url;
}

export async function refreshPartnerAccountStatus(partnerId: string): Promise<void> {
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    select: { connectId: true }
  });

  if (!partner?.connectId) {
    throw new Error("Partner has no Stripe account");
  }

  const account = await stripe.accounts.retrieve(partner.connectId) as StripeAccount;

  // Determine connect status
  let connectStatus = "complete";
  if (!account.charges_enabled) {
    connectStatus = "onboarding_required";
  } else if (account.requirements.currently_due.length > 0) {
    connectStatus = "requirements_pending";
  } else if (account.requirements.past_due.length > 0) {
    connectStatus = "restricted";
  }

  // Update partner record with status (we'll add these fields to the schema)
  // For now, we'll just log the status
  console.log(`Partner ${partnerId} connect status: ${connectStatus}`);
}

export async function createTransferToPartner(
  partnerId: string, 
  amount: number, 
  currency: string, 
  periodStart: Date,
  periodEnd: Date,
  description?: string
): Promise<Stripe.Transfer> {
  
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    select: { connectId: true, name: true }
  });

  if (!partner?.connectId) {
    throw new Error("Partner has no Stripe account");
  }

  // Calculate platform fee for affiliate payouts
  const platformFee = Math.round(amount * (connectConfig.STRIPE_PLATFORM_FEE_BPS / 10000));
  const transferAmount = amount - platformFee;

  const transfer = await stripe.transfers.create({
    amount: transferAmount,
    currency: currency.toLowerCase(),
    destination: partner.connectId,
    description: description || `Affiliate commission for ${partner.name} (${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]})`,
    metadata: {
      partnerId,
      partnerName: partner.name,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      platformFee: platformFee.toString(),
      platformFeeBps: connectConfig.STRIPE_PLATFORM_FEE_BPS.toString(),
    },
  });

  return transfer;
}

// =============================================================================
// Payout Processing Functions (new)
// =============================================================================

export async function processAffiliatePayouts(): Promise<{
  processed: number;
  totalAmount: number;
  errors: Array<{ partnerId: string; error: string }>;
}> {
  const errors: Array<{ partnerId: string; error: string }> = [];
  let processed = 0;
  let totalAmount = 0;

  // Get all partners with pending payouts
  const partnersWithPayouts = await prisma.partner.findMany({
    where: {
      connectId: { not: null },
      conversions: {
        some: {
          status: "APPROVED"
        }
      }
    },
    include: {
      conversions: {
        where: {
          status: "APPROVED"
        }
      }
    }
  });

  const payoutMinEur = parseInt(process.env.AFFIL_PAYOUT_MIN_EUR || "5000"); // 50 EUR in minor units

  for (const partner of partnersWithPayouts) {
    try {
      // Calculate total pending commission
      const totalCommission = partner.conversions.reduce((sum, conv) => {
        // Convert to EUR if needed for unified reporting
        const amountEur = conv.eurMinor || conv.commissionMinor;
        return sum + amountEur;
      }, 0);

      // Check if meets minimum threshold
      if (totalCommission < payoutMinEur) {
        continue;
      }

      // Determine payout period (last month)
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Create transfer to partner
      const transfer = await createTransferToPartner(
        partner.id,
        totalCommission,
        "EUR",
        periodStart,
        periodEnd,
        `Monthly affiliate commission for ${partner.name}`
      );

      // Create payout record
      await prisma.commissionPayout.create({
        data: {
          partnerId: partner.id,
          amountMinor: totalCommission,
          currency: "EUR",
          stripePayoutId: transfer.id,
          periodStart,
          periodEnd,
        }
      });

      // Mark conversions as PAID
      await prisma.referralConversion.updateMany({
        where: {
          partnerId: partner.id,
          status: "APPROVED"
        },
        data: {
          status: "PAID"
        }
      });

      processed++;
      totalAmount += totalCommission;

    } catch (error) {
      console.error(`Failed to process payout for partner ${partner.id}:`, error);
      errors.push({
        partnerId: partner.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  return { processed, totalAmount, errors };
}

export async function createTransferReversal(
  transferId: string,
  amount: number,
  metadata?: Record<string, string>
): Promise<Stripe.TransferReversal> {
  const reversal = await stripe.transfers.createReversal(transferId, {
    amount,
    metadata,
  });

  return reversal;
}

export function getPlatformFeeBps(): number {
  return connectConfig.CONNECT_PLATFORM_FEE_BPS;
}

export function getPayoutDelayDays(): number {
  return connectConfig.CONNECT_PAYOUT_DELAY_DAYS;
}

export function calculateArtistShare(subtotal: number, platformFeeBps?: number): number {
  const feeBps = platformFeeBps || connectConfig.CONNECT_PLATFORM_FEE_BPS;
  return Math.round(subtotal * (10000 - feeBps) / 10000);
}
