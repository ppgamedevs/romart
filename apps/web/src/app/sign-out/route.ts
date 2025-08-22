import { NextRequest, NextResponse } from "next/server"
import { signOut } from "next-auth/react"

export async function GET(request: NextRequest) {
	await signOut({ redirect: false })
	return NextResponse.redirect(new URL("/", request.url))
}
