import { auth } from "@/auth/config"
import { prisma } from "@artfromromania/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only allow users to access their own profile
    if (session.user.id !== params.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const artist = await prisma.artist.findUnique({
      where: { userId: params.userId },
      select: {
        displayName: true,
        slug: true,
        bio: true,
        statement: true,
        locationCity: true,
        locationCountry: true,
        avatarUrl: true,
        coverUrl: true,
        website: true,
        instagram: true,
        facebook: true,
        x: true,
        tiktok: true,
        youtube: true,
        education: true,
        exhibitions: true,
        awards: true,
        completionScore: true,
        kycStatus: true,
      }
    })

    if (!artist) {
      return NextResponse.json({ error: "Artist profile not found" }, { status: 404 })
    }

    return NextResponse.json(artist)
  } catch (error) {
    console.error("Error fetching artist profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
