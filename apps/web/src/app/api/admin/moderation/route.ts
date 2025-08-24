import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/auth/utils"
import { prisma } from "@artfromromania/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession()
    
    // Check if user is admin
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "PENDING"
    const entityType = searchParams.get("entityType")
    const cursor = searchParams.get("cursor")
    const limit = parseInt(searchParams.get("limit") || "20")

    const where: any = { status }
    if (entityType) {
      where.entityType = entityType
    }

    const items = await prisma.moderationItem.findMany({
      where,
      include: {
        actions: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
      orderBy: { createdAt: "asc" },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined
    })

    const hasMore = items.length > limit
    const nextCursor = hasMore ? items[limit - 1].id : null
    const results = hasMore ? items.slice(0, limit) : items

    // Get entity details for each item
    const itemsWithDetails = await Promise.all(
      results.map(async (item) => {
        let entity = null
        
        if (item.entityType === "ARTWORK") {
          entity = await prisma.artwork.findUnique({
            where: { id: item.entityId },
            include: {
              artist: {
                select: {
                  id: true,
                  displayName: true,
                  slug: true
                }
              },
              images: {
                orderBy: { position: "asc" },
                take: 1
              }
            }
          })
        } else if (item.entityType === "ARTIST") {
          entity = await prisma.artist.findUnique({
            where: { id: item.entityId },
            select: {
              id: true,
              displayName: true,
              slug: true,
              avatarUrl: true
            }
          })
        }

        return {
          ...item,
          entity
        }
      })
    )

    return NextResponse.json({
      items: itemsWithDetails,
      nextCursor,
      hasMore
    })
  } catch (error) {
    console.error("Failed to get moderation queue:", error)
    return NextResponse.json(
      { error: "Failed to get moderation queue" },
      { status: 500 }
    )
  }
}
