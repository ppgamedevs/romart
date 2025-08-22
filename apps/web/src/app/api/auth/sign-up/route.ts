import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@artfromromania/db"
import { hashPassword } from "@artfromromania/auth"
import { UserRole } from "@prisma/client"
import { z } from "zod"

const signUpSchema = z.object({
	email: z.string().email(),
	name: z.string().min(2),
	password: z.string().min(8)
})

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const { email, name, password } = signUpSchema.parse(body)

		// Check if user already exists
		const existingUser = await prisma.user.findUnique({
			where: { email }
		})

		if (existingUser) {
			return NextResponse.json(
				{ error: "User with this email already exists" },
				{ status: 400 }
			)
		}

		// Hash password
		const passwordHash = await hashPassword(password)

		// Create user with BUYER role
		const user = await prisma.user.create({
			data: {
				email,
				name,
				passwordHash,
				role: UserRole.BUYER
			}
		})

		return NextResponse.json(
			{ message: "User created successfully", userId: user.id },
			{ status: 201 }
		)
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid input data" },
				{ status: 400 }
			)
		}

		console.error("Sign-up error:", error)
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		)
	}
}
