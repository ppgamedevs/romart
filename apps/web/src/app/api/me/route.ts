import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth/config"

export async function GET(request: NextRequest) {
	try {
		const session = await auth()

		if (!session?.user) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			)
		}

		return NextResponse.json({
			id: session.user.id,
			email: session.user.email,
			role: session.user.role
		})
	} catch (error) {
		console.error("Me API error:", error)
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		)
	}
}
