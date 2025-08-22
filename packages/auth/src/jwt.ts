import { SignJWT, jwtVerify } from "jose"
import { env } from "@artfromromania/shared"

export interface JWTPayload {
	id: string
	email: string
	role: string
	iat?: number
	exp?: number
}

export async function signJwt(payload: Omit<JWTPayload, "iat" | "exp">, expiresIn = "7d"): Promise<string> {
	const secret = new TextEncoder().encode(env.NEXTAUTH_SECRET)
	
	const jwt = await new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime(expiresIn)
		.sign(secret)
	
	return jwt
}

export async function verifyJwt(token: string): Promise<JWTPayload> {
	try {
		const secret = new TextEncoder().encode(env.NEXTAUTH_SECRET)
		const { payload } = await jwtVerify(token, secret)
		
		return {
			id: payload.id as string,
			email: payload.email as string,
			role: payload.role as string,
			iat: payload.iat as number,
			exp: payload.exp as number
		}
	} catch (error) {
		throw new Error("Invalid JWT token")
	}
}
