import { type PrismaClient } from "@prisma/client";

export interface PayoutSummary {
  pending: number;
  paid: number;
}

export interface RecentPayout {
  id: string;
  amount: number;
  currency: string;
  status: string;
  providerTransferId: string | null;
  createdAt: Date;
  orderItem: {
    id: string;
    order: {
      id: string;
    };
  };
}

export async function getArtistPayoutSummary(
  client: PrismaClient,
  artistId: string
): Promise<PayoutSummary> {
  const [pendingResult, paidResult] = await Promise.all([
    client.payout.aggregate({
      where: {
        artistId,
        status: "PENDING",
      },
      _sum: {
        amount: true,
      },
    }),
    client.payout.aggregate({
      where: {
        artistId,
        status: "PAID",
      },
      _sum: {
        amount: true,
      },
    }),
  ]);

  return {
    pending: pendingResult._sum.amount || 0,
    paid: paidResult._sum.amount || 0,
  };
}

export async function getArtistRecentPayouts(
  client: PrismaClient,
  artistId: string,
  limit: number = 10
): Promise<RecentPayout[]> {
  return client.payout.findMany({
    where: {
      artistId,
      status: { in: ["PAID", "REVERSED"] },
      providerTransferId: { not: null },
    },
    select: {
      id: true,
      amount: true,
      currency: true,
      status: true,
      providerTransferId: true,
      createdAt: true,
      orderItem: {
        select: {
          id: true,
          order: {
            select: {
              id: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}

export async function createPayout(
  client: PrismaClient,
  data: {
    artistId: string;
    orderItemId: string;
    amount: number;
    currency: string;
    availableAt?: Date;
  }
) {
  return client.payout.create({
    data: {
      artistId: data.artistId,
      orderItemId: data.orderItemId,
      amount: data.amount,
      currency: data.currency,
      availableAt: data.availableAt,
    },
  });
}

export async function updatePayoutStatus(
  client: PrismaClient,
  payoutId: string,
  status: "PAID" | "FAILED" | "REVERSED",
  providerTransferId?: string
) {
  return client.payout.update({
    where: { id: payoutId },
    data: {
      status,
      providerTransferId,
      provider: "STRIPE",
    },
  });
}

export async function getPendingPayoutsDue(
  client: PrismaClient,
  limit: number = 50
) {
  return client.payout.findMany({
    where: {
      status: "PENDING",
      OR: [
        { availableAt: null },
        { availableAt: { lte: new Date() } },
      ],
    },
    include: {
      artist: {
        select: {
          id: true,
          stripeAccountId: true,
          payoutsEnabled: true,
        },
      },
      orderItem: {
        select: {
          id: true,
          order: {
            select: {
              id: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    take: limit,
  });
}

export async function getPayoutsByOrderId(
  client: PrismaClient,
  orderId: string
) {
  return client.payout.findMany({
    where: {
      orderItem: {
        orderId,
      },
    },
    include: {
      artist: {
        select: {
          id: true,
          stripeAccountId: true,
        },
      },
      orderItem: {
        select: {
          id: true,
          subtotal: true,
        },
      },
    },
  });
}
