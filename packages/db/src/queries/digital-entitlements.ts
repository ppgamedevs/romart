import { type PrismaClient } from "@prisma/client";

export async function getUserDigitalEntitlements(
  client: PrismaClient,
  userId: string
) {
  return client.digitalEntitlement.findMany({
    where: { userId },
    include: {
      edition: {
        include: {
          artwork: {
            select: {
              id: true,
              title: true,
              slug: true,
              heroImageUrl: true,
              artist: {
                select: {
                  displayName: true,
                  slug: true
                }
              }
            }
          }
        }
      },
      order: {
        select: {
          id: true,
          createdAt: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

export async function createDigitalEntitlement(
  client: PrismaClient,
  data: {
    orderId: string;
    userId: string;
    editionId: string;
    token: string;
    maxDownloads?: number;
    expiresAt?: Date;
  }
) {
  return client.digitalEntitlement.create({
    data: {
      orderId: data.orderId,
      userId: data.userId,
      editionId: data.editionId,
      token: data.token,
      maxDownloads: data.maxDownloads || 5,
      expiresAt: data.expiresAt
    }
  });
}

export async function getEntitlementByToken(
  client: PrismaClient,
  token: string
) {
  return client.digitalEntitlement.findUnique({
    where: { token },
    include: {
      edition: {
        select: {
          id: true,
          privateFileKey: true,
          contentType: true,
          fileBytes: true,
          checksumSha256: true,
          artwork: {
            select: {
              title: true,
              artist: {
                select: {
                  displayName: true
                }
              }
            }
          }
        }
      },
      user: {
        select: {
          email: true
        }
      },
      order: {
        select: {
          id: true
        }
      }
    }
  });
}

export async function incrementDownloadCount(
  client: PrismaClient,
  entitlementId: string
) {
  return client.digitalEntitlement.update({
    where: { id: entitlementId },
    data: {
      downloadsCount: {
        increment: 1
      },
      lastDownloadedAt: new Date()
    }
  });
}

export async function updateEditionDigitalFile(
  client: PrismaClient,
  editionId: string,
  data: {
    privateFileKey: string;
    contentType: string;
    fileBytes: number;
    checksumSha256: string;
  }
) {
  return client.edition.update({
    where: { id: editionId },
    data: {
      privateFileKey: data.privateFileKey,
      contentType: data.contentType,
      fileBytes: data.fileBytes,
      checksumSha256: data.checksumSha256
    }
  });
}
