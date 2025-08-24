import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth/config"
import { prisma } from "@artfromromania/db"
import { UserRole } from "@prisma/client"

export async function POST(request: NextRequest) {
	try {
		const session = await auth()

		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			)
		}

		const user = await prisma.user.findUnique({
			where: { id: session.user.id }
		})

		if (!user) {
			return NextResponse.json(
				{ error: "User not found" },
				{ status: 404 }
			)
		}

		if (user.role !== UserRole.BUYER) {
			return NextResponse.json(
				{ error: "Only buyers can upgrade to artist" },
				{ status: 400 }
			)
		}

		// Generate slug from name
		const displayName = user.name || user.email || "Artist"
		const slug = `${displayName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${user.id.slice(-8)}`

		// Update user role and create artist profile
		await prisma.$transaction([
			prisma.user.update({
				where: { id: user.id },
				data: { role: UserRole.ARTIST }
			}),
			prisma.artist.create({
				data: {
					userId: user.id,
					slug,
					displayName
				}
			})
		])

		return NextResponse.json(
			{ message: "Successfully upgraded to artist" },
			{ status: 200 }
		)
	} catch (error) {
		console.error("Become artist error:", error)
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		)
	}
}
