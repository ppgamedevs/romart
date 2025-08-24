import { prisma } from "@artfromromania/db";
import { 
  classifyImage, 
  classifyText, 
  determineContentRating, 
  createModerationSignals 
} from "./classifier";
import { 
  AUTO_THRESHOLD_MATURE, 
  AUTO_THRESHOLD_REJECT,
  MODERATION_ACTIONS,
  AUDIT_ACTIONS,
  ENTITY_TYPES
} from "@artfromromania/shared";

/**
 * Create a moderation item for an artwork
 */
export async function createArtworkModerationItem(artworkId: string) {
  try {
    // Get artwork with images
    const artwork = await prisma.artwork.findUnique({
      where: { id: artworkId },
      include: {
        images: {
          orderBy: { position: "asc" },
          take: 1 // Only check primary image for now
        }
      }
    });

    if (!artwork) {
      throw new Error(`Artwork ${artworkId} not found`);
    }

    // Classify content
    const imageResult = await classifyImage({ 
      key: artwork.images[0]?.storageKey || "" 
    });
    
    const textResult = await classifyText({ 
      text: `${artwork.title} ${artwork.description || ""}` 
    });

    const contentRating = determineContentRating(imageResult, textResult);
    const autoSignals = createModerationSignals(imageResult, textResult);

    // Determine moderation status based on content rating
    let moderationStatus: "PENDING" | "APPROVED" | "REJECTED" | "MATURE" = "PENDING";
    let suppressed = false;

    if (contentRating === "PROHIBITED") {
      moderationStatus = "REJECTED";
      suppressed = true;
    } else if (contentRating === "MATURE") {
      moderationStatus = "PENDING"; // Requires human review
    } else {
      moderationStatus = "APPROVED"; // Safe content auto-approved
    }

    // Update artwork with moderation results
    await prisma.artwork.update({
      where: { id: artworkId },
      data: {
        moderationStatus,
        contentRating,
        suppressed,
        lastReviewedAt: moderationStatus === "APPROVED" ? new Date() : null
      }
    });

    // Create moderation item
    const moderationItem = await prisma.moderationItem.create({
      data: {
        entityType: ENTITY_TYPES.ARTWORK,
        entityId: artworkId,
        status: moderationStatus,
        autoSignals,
        reason: contentRating === "PROHIBITED" ? "Auto-rejected due to prohibited content" : 
                contentRating === "MATURE" ? "Auto-flagged for mature content review" : 
                "Auto-approved as safe content"
      }
    });

    // Log audit
    await logAudit({
      action: AUDIT_ACTIONS.MODERATION_DECISION,
      entityType: ENTITY_TYPES.ARTWORK,
      entityId: artworkId,
      data: {
        moderationStatus,
        contentRating,
        autoSignals
      }
    });

    return moderationItem;
  } catch (error) {
    console.error("Failed to create artwork moderation item:", error);
    throw error;
  }
}

/**
 * Approve a moderation item
 */
export async function approveModerationItem(
  itemId: string, 
  reviewerId: string, 
  notes?: string
) {
  const item = await prisma.moderationItem.findUnique({
    where: { id: itemId }
  });

  if (!item) {
    throw new Error("Moderation item not found");
  }

  // Update moderation item
  await prisma.moderationItem.update({
    where: { id: itemId },
    data: {
      status: "APPROVED",
      reviewerId,
      updatedAt: new Date()
    }
  });

  // Update entity based on type
  if (item.entityType === ENTITY_TYPES.ARTWORK) {
    await prisma.artwork.update({
      where: { id: item.entityId },
      data: {
        moderationStatus: "APPROVED",
        contentRating: "SAFE",
        suppressed: false,
        lastReviewedAt: new Date()
      }
    });
  }

  // Create moderation action
  await prisma.moderationAction.create({
    data: {
      itemId,
      actorId: reviewerId,
      action: MODERATION_ACTIONS.APPROVE,
      notes
    }
  });

  // Log audit
  await logAudit({
    actorId: reviewerId,
    action: AUDIT_ACTIONS.MODERATION_DECISION,
    entityType: item.entityType,
    entityId: item.entityId,
    data: {
      action: "APPROVE",
      notes
    }
  });
}

/**
 * Mark content as mature
 */
export async function markMatureModerationItem(
  itemId: string, 
  reviewerId: string, 
  notes?: string
) {
  const item = await prisma.moderationItem.findUnique({
    where: { id: itemId }
  });

  if (!item) {
    throw new Error("Moderation item not found");
  }

  // Update moderation item
  await prisma.moderationItem.update({
    where: { id: itemId },
    data: {
      status: "APPROVED",
      reviewerId,
      updatedAt: new Date()
    }
  });

  // Update entity based on type
  if (item.entityType === ENTITY_TYPES.ARTWORK) {
    await prisma.artwork.update({
      where: { id: item.entityId },
      data: {
        moderationStatus: "APPROVED",
        contentRating: "MATURE",
        suppressed: false,
        lastReviewedAt: new Date()
      }
    });
  }

  // Create moderation action
  await prisma.moderationAction.create({
    data: {
      itemId,
      actorId: reviewerId,
      action: MODERATION_ACTIONS.MARK_MATURE,
      notes
    }
  });

  // Log audit
  await logAudit({
    actorId: reviewerId,
    action: AUDIT_ACTIONS.MODERATION_DECISION,
    entityType: item.entityType,
    entityId: item.entityId,
    data: {
      action: "MARK_MATURE",
      notes
    }
  });
}

/**
 * Reject a moderation item
 */
export async function rejectModerationItem(
  itemId: string, 
  reviewerId: string, 
  notes?: string
) {
  const item = await prisma.moderationItem.findUnique({
    where: { id: itemId }
  });

  if (!item) {
    throw new Error("Moderation item not found");
  }

  // Update moderation item
  await prisma.moderationItem.update({
    where: { id: itemId },
    data: {
      status: "REJECTED",
      reviewerId,
      reason: notes,
      updatedAt: new Date()
    }
  });

  // Update entity based on type
  if (item.entityType === ENTITY_TYPES.ARTWORK) {
    await prisma.artwork.update({
      where: { id: item.entityId },
      data: {
        moderationStatus: "REJECTED",
        contentRating: "PROHIBITED",
        suppressed: true,
        lastReviewedAt: new Date()
      }
    });
  }

  // Create moderation action
  await prisma.moderationAction.create({
    data: {
      itemId,
      actorId: reviewerId,
      action: MODERATION_ACTIONS.REJECT,
      notes
    }
  });

  // Log audit
  await logAudit({
    actorId: reviewerId,
    action: AUDIT_ACTIONS.MODERATION_DECISION,
    entityType: item.entityType,
    entityId: item.entityId,
    data: {
      action: "REJECT",
      notes
    }
  });
}

/**
 * Ban an artist
 */
export async function banArtist(
  artistId: string, 
  actorId: string, 
  reason: string
) {
  await prisma.artist.update({
    where: { id: artistId },
    data: {
      banned: true,
      banReason: reason
    }
  });

  // Log audit
  await logAudit({
    actorId,
    action: AUDIT_ACTIONS.BAN_ARTIST,
    entityType: ENTITY_TYPES.ARTIST,
    entityId: artistId,
    data: { reason }
  });
}

/**
 * Unban an artist
 */
export async function unbanArtist(
  artistId: string, 
  actorId: string, 
  notes?: string
) {
  await prisma.artist.update({
    where: { id: artistId },
    data: {
      banned: false,
      banReason: null
    }
  });

  // Log audit
  await logAudit({
    actorId,
    action: AUDIT_ACTIONS.UNBAN_ARTIST,
    entityType: ENTITY_TYPES.ARTIST,
    entityId: artistId,
    data: { notes }
  });
}

/**
 * Shadowban an artist
 */
export async function shadowbanArtist(
  artistId: string, 
  actorId: string, 
  notes?: string
) {
  await prisma.artist.update({
    where: { id: artistId },
    data: {
      shadowbanned: true
    }
  });

  // Log audit
  await logAudit({
    actorId,
    action: AUDIT_ACTIONS.SHADOWBAN_ARTIST,
    entityType: ENTITY_TYPES.ARTIST,
    entityId: artistId,
    data: { notes }
  });
}

/**
 * Remove shadowban from an artist
 */
export async function unshadowbanArtist(
  artistId: string, 
  actorId: string, 
  notes?: string
) {
  await prisma.artist.update({
    where: { id: artistId },
    data: {
      shadowbanned: false
    }
  });

  // Log audit
  await logAudit({
    actorId,
    action: AUDIT_ACTIONS.UNSHADOWBAN_ARTIST,
    entityType: ENTITY_TYPES.ARTIST,
    entityId: artistId,
    data: { notes }
  });
}

/**
 * Log audit entry
 */
export async function logAudit(params: {
  actorId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  ip?: string;
  userAgent?: string;
  data?: any;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: params.actorId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      ip: params.ip,
      userAgent: params.userAgent,
      data: params.data
    }
  });
}
