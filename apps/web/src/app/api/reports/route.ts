import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/auth/utils"
import { prisma } from "@artfromromania/db"
import { 
  REPORT_CATEGORIES,
  ENTITY_TYPES,
  AUDIT_ACTIONS
} from "@artfromromania/shared"

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()
    const body = await request.json()
    
    const { entityType, entityId, category, message } = body

    // Validate entity type
    if (!Object.values(ENTITY_TYPES).includes(entityType)) {
      return NextResponse.json(
        { error: "Invalid entity type" },
        { status: 400 }
      )
    }

    // Validate category
    if (!Object.values(REPORT_CATEGORIES).includes(category)) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      )
    }

    // Check if entity exists
    let entity = null
    if (entityType === ENTITY_TYPES.ARTWORK) {
      entity = await prisma.artwork.findUnique({
        where: { id: entityId }
      })
    } else if (entityType === ENTITY_TYPES.ARTIST) {
      entity = await prisma.artist.findUnique({
        where: { id: entityId }
      })
    }

    if (!entity) {
      return NextResponse.json(
        { error: "Entity not found" },
        { status: 404 }
      )
    }

    // Get reporter ID if authenticated
    const reporterId = session?.user?.id

    // Create report
    const report = await prisma.report.create({
      data: {
        reporterId,
        entityType,
        entityId,
        category,
        message,
        status: "OPEN"
      }
    })

    // Check if we need to create a moderation item
    const reportCount = await prisma.report.count({
      where: {
        entityType,
        entityId,
        status: "OPEN"
      }
    })

    // If 3+ reports, increase flagged count and prioritize moderation
    if (reportCount >= 3) {
      if (entityType === ENTITY_TYPES.ARTWORK) {
        await prisma.artwork.update({
          where: { id: entityId },
          data: {
            flaggedCount: {
              increment: 1
            }
          }
        })
      }
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: reporterId,
        action: AUDIT_ACTIONS.CREATE_REPORT,
        entityType,
        entityId,
        ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
        data: {
          category,
          message,
          reportId: report.id
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      reportId: report.id 
    })
  } catch (error) {
    console.error("Failed to create report:", error)
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 500 }
    )
  }
}
