import { PrismaClient } from "@prisma/client";

export async function createFulfillmentOrder(
  client: PrismaClient,
  data: {
    orderId: string;
    provider: string;
    providerOrderId?: string;
    status?: string;
    shippingMethod?: string;
    costAmount?: number;
    currency?: string;
  }
) {
  return client.fulfillmentOrder.create({
    data: {
      orderId: data.orderId,
      provider: data.provider,
      providerOrderId: data.providerOrderId,
      status: (data.status as any) || "DRAFT",
      shippingMethod: data.shippingMethod,
      costAmount: data.costAmount || 0,
      currency: data.currency || "EUR",
    },
  });
}

export async function createFulfillmentItem(
  client: PrismaClient,
  data: {
    fulfillmentId: string;
    orderItemId: string;
    editionId?: string;
    quantity: number;
    material?: string;
    sizeName?: string;
    widthCm?: number;
    heightCm?: number;
    sourceImageKey?: string;
    providerSku?: string;
  }
) {
  return client.fulfillmentItem.create({
    data: {
      fulfillmentId: data.fulfillmentId,
      orderItemId: data.orderItemId,
      editionId: data.editionId,
      quantity: data.quantity,
      material: data.material,
      sizeName: data.sizeName,
      widthCm: data.widthCm,
      heightCm: data.heightCm,
      sourceImageKey: data.sourceImageKey,
      providerSku: data.providerSku,
    },
  });
}

export async function getFulfillmentQueue(
  client: PrismaClient,
  filters: {
    status?: string[];
    material?: string[];
    assignedToUserId?: string;
    limit?: number;
    offset?: number;
  } = {}
) {
  const where: any = {};

  if (filters.status && filters.status.length > 0) {
    where.status = { in: filters.status };
  }

  if (filters.assignedToUserId) {
    where.assignedToUserId = filters.assignedToUserId;
  }

  return client.fulfillmentOrder.findMany({
    where,
    include: {
      order: {
        include: {
          buyer: {
            select: {
              name: true,
              email: true,
            },
          },
          shippingAddress: true,
        },
      },
      items: {
        include: {
          orderItem: {
            include: {
              artwork: {
                select: {
                  title: true,
                  artist: {
                    select: {
                      displayName: true,
                    },
                  },
                },
              },
              edition: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: filters.limit || 50,
    skip: filters.offset || 0,
  });
}

export async function updateFulfillmentStatus(
  client: PrismaClient,
  fulfillmentId: string,
  status: string,
  data?: {
    assignedToUserId?: string;
    startedAt?: Date;
    finishedAt?: Date;
    qcPassedAt?: Date;
    trackingNumbers?: any;
  }
) {
  return client.fulfillmentOrder.update({
    where: { id: fulfillmentId },
    data: {
      status: status as any,
      ...data,
    },
  });
}

export async function getFulfillmentById(
  client: PrismaClient,
  fulfillmentId: string
) {
  return client.fulfillmentOrder.findUnique({
    where: { id: fulfillmentId },
    include: {
      order: {
        include: {
          buyer: true,
          shippingAddress: true,
        },
      },
      items: {
        include: {
          orderItem: {
            include: {
              artwork: {
                include: {
                  artist: true,
                  images: true,
                },
              },
              edition: true,
            },
          },
        },
      },
    },
  });
}

export async function getFulfillmentByOrderId(
  client: PrismaClient,
  orderId: string
) {
  return client.fulfillmentOrder.findFirst({
    where: { orderId },
    include: {
      items: {
        include: {
          orderItem: {
            include: {
              artwork: true,
              edition: true,
            },
          },
        },
      },
    },
  });
}
