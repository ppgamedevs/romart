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
}).parse({
  STRIPE_CONNECT_CLIENT_ID: process.env.STRIPE_CONNECT_CLIENT_ID,
  CONNECT_ONBOARDING_RETURN_URL: process.env.CONNECT_ONBOARDING_RETURN_URL,
  CONNECT_ONBOARDING_REFRESH_URL: process.env.CONNECT_ONBOARDING_REFRESH_URL,
  CONNECT_PLATFORM_FEE_BPS: process.env.CONNECT_PLATFORM_FEE_BPS || "3000",
  CONNECT_PAYOUT_DELAY_DAYS: process.env.CONNECT_PAYOUT_DELAY_DAYS || "0",
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

export async function getOrCreateStripeAccount(artistId: string): Promise<StripeAccount> {
  // Get artist with current Stripe account info
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
    email: artist.user.email,
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
    select: { stripeAccountId: true, payoutsEnabled: true }
  });

  if (!artist?.stripeAccountId) {
    throw new Error("Artist has no Stripe account");
  }

  if (!artist.payoutsEnabled) {
    throw new Error("Artist payouts not enabled");
  }

  const transfer = await stripe.transfers.create({
    amount,
    currency,
    destination: artist.stripeAccountId,
    description: description || `RomArt order ${orderId}`,
    transfer_group: orderId,
    metadata: {
      orderId,
      artistId,
    },
  });

  return transfer;
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
