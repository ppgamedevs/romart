import { prisma } from "@artfromromania/db";
import { 
  scoreText,
  AUDIT_ACTIONS,
  ENTITY_TYPES
} from "@artfromromania/shared";

/**
 * Create a moderation item for an artwork
 */
export async function createArtworkModerationItem(artworkId: string): Promise<any> {
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

    // Classify text content
    const textResult = scoreText(`${artwork.title} ${artwork.description || ""}`);
    
    // For now, we'll use a simple heuristic for content rating
    // In a real implementation, this would use the vision API
    let contentRating: "SAFE" | "MATURE" | "PROHIBITED" = "SAFE";
    
    if (textResult.profanity) {
      contentRating = "MATURE";
    }
    
    // For demonstration, let's add a case for prohibited content
    if (textResult.wordsHit.length > 5) {
      contentRating = "PROHIBITED";
    }

    const autoSignals = {
      text: {
        profanity: textResult.profanity,
        links: textResult.links,
        wordsHit: textResult.wordsHit
      },
      image: {
        nsfwScores: {}, // Would be populated by vision API
        label: "unknown"
      },
      timestamp: new Date().toISOString()
    };

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
    await prisma.auditLog.create({
      data: {
        action: AUDIT_ACTIONS.MODERATION_DECISION,
        entityType: ENTITY_TYPES.ARTWORK,
        entityId: artworkId,
        data: {
          moderationStatus,
          contentRating,
          autoSignals
        }
      }
    });

    return moderationItem;
  } catch (error) {
    console.error("Failed to create artwork moderation item:", error);
    throw error;
  }
}
