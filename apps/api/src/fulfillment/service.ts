import { prisma } from "@artfromromania/db";
import { generateJobTicket, generatePackingSlip } from "./pdf";
import { uploadToPrivateStorage } from "@artfromromania/storage";

export async function processFulfillmentForOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          edition: true,
          artwork: {
            include: {
              artist: true,
              images: true,
            },
          },
        },
      },
      shippingAddress: true,
      buyer: true,
    },
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  // Filter only PRINT items
  const printItems = order.items.filter(
    (item) => item.edition?.type === "PRINT"
  );

  if (printItems.length === 0) {
    console.log(`No PRINT items found in order ${orderId}`);
    return null;
  }

  // Create fulfillment order
  const fulfillment = await prisma.fulfillmentOrder.create({
    data: {
      orderId: order.id,
      provider: "INHOUSE",
      status: "SUBMITTED",
      shippingMethod: "STANDARD",
      currency: order.currency,
    },
  });

  // Create fulfillment items
  const fulfillmentItems = [];
  for (const item of printItems) {
    const edition = item.edition!;
    const artwork = item.artwork!;

    // Find print master image or fallback to largest image
    let sourceImage = artwork.images.find((img) => img.isPrintMaster);
    if (!sourceImage) {
      // Fallback to largest image
      sourceImage = artwork.images
        .filter((img) => img.width && img.height)
        .sort((a, b) => (b.width! * b.height!) - (a.width! * a.height!))[0];
    }

    const fulfillmentItem = await prisma.fulfillmentItem.create({
      data: {
        fulfillmentId: fulfillment.id,
        orderItemId: item.id,
        editionId: edition.id,
        quantity: item.quantity,
        material: edition.material || "CANVAS",
        sizeName: edition.sizeName,
        widthCm: edition.widthCm?.toNumber(),
        heightCm: edition.heightCm?.toNumber(),
        sourceImageKey: sourceImage?.storageKey,
      },
    });

    fulfillmentItems.push(fulfillmentItem);
  }

  // Generate PDFs
  const fulfillmentWithDetails = await prisma.fulfillmentOrder.findUnique({
    where: { id: fulfillment.id },
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
                },
              },
              edition: true,
            },
          },
        },
      },
    },
  });

  if (!fulfillmentWithDetails) {
    throw new Error(`Fulfillment ${fulfillment.id} not found`);
  }

  // Generate and upload job ticket
  const jobTicketBuffer = await generateJobTicket(
    fulfillmentWithDetails,
    fulfillmentWithDetails.items
  );
  const jobTicketKey = `fulfillment/${fulfillment.id}/job-ticket.pdf`;
  await uploadToPrivateStorage(jobTicketKey, jobTicketBuffer, "application/pdf");

  // Generate and upload packing slip
  const packingSlipBuffer = await generatePackingSlip(
    fulfillmentWithDetails,
    fulfillmentWithDetails.items
  );
  const packingSlipKey = `fulfillment/${fulfillment.id}/packing-slip.pdf`;
  await uploadToPrivateStorage(packingSlipKey, packingSlipBuffer, "application/pdf");

  // Update fulfillment with PDF keys
  await prisma.fulfillmentOrder.update({
    where: { id: fulfillment.id },
    data: {
      jobTicketKey,
      labelsStorageKey: packingSlipKey,
    },
  });

  return fulfillment;
}

export async function getFulfillmentQueue(filters: {
  status?: string[];
  material?: string[];
  assignedToUserId?: string;
  limit?: number;
  offset?: number;
} = {}) {
  return prisma.fulfillmentOrder.findMany({
    where: {
      ...(filters.status && filters.status.length > 0
        ? { status: { in: filters.status as any[] } }
        : {}),
      ...(filters.assignedToUserId
        ? { assignedToUserId: filters.assignedToUserId }
        : {}),
    },
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
  return prisma.fulfillmentOrder.update({
    where: { id: fulfillmentId },
    data: {
      status: status as any,
      ...data,
    },
  });
}

export async function getFulfillmentById(fulfillmentId: string) {
  return prisma.fulfillmentOrder.findUnique({
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
