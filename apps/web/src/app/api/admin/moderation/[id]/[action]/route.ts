import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/auth/utils"
import { prisma } from "@artfromromania/db"
import { 
  MODERATION_ACTIONS,
  AUDIT_ACTIONS,
  ENTITY_TYPES
} from "@artfromromania/shared"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  const { id, action } = await params
  try {
    const session = await getAuthSession()
    
    // Check if user is admin
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }


    const { notes } = await request.json()

    // Validate action
    if (!["approve", "reject", "mark-mature"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      )
    }

    // Get the moderation item
    const item = await prisma.moderationItem.findUnique({
      where: { id }
    })

    if (!item) {
      return NextResponse.json(
        { error: "Moderation item not found" },
        { status: 404 }
      )
    }

    // Update moderation item
    await prisma.moderationItem.update({
      where: { id },
      data: {
        status: action === "approve" || action === "mark-mature" ? "APPROVED" : "REJECTED",
        reviewerId: session.user.id,
        reason: notes,
        updatedAt: new Date()
      }
    })

    // Update entity based on type
    if (item.entityType === ENTITY_TYPES.ARTWORK) {
      await prisma.artwork.update({
        where: { id: item.entityId },
        data: {
          moderationStatus: action === "approve" || action === "mark-mature" ? "APPROVED" : "REJECTED",
          contentRating: action === "mark-mature" ? "MATURE" : action === "approve" ? "SAFE" : "PROHIBITED",
          suppressed: action === "reject",
          lastReviewedAt: new Date()
        }
      })
    }

    // Create moderation action
    await prisma.moderationAction.create({
      data: {
        itemId: id,
        actorId: session.user.id,
        action: action === "approve" ? MODERATION_ACTIONS.APPROVE :
                action === "mark-mature" ? MODERATION_ACTIONS.MARK_MATURE :
                MODERATION_ACTIONS.REJECT,
        notes
      }
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: AUDIT_ACTIONS.MODERATION_DECISION,
        entityType: item.entityType,
        entityId: item.entityId,
        data: {
          action,
          notes
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to perform moderation action:", error)
    return NextResponse.json(
      { error: "Failed to perform action" },
      { status: 500 }
    )
  }
}
