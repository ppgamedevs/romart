import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"
// import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@artfromromania/db"
import { env } from "@artfromromania/shared"

export const authOptions: NextAuthConfig = {
	// Temporarily remove adapter to fix version conflicts
	// adapter: PrismaAdapter(prisma),
	secret: env.NEXTAUTH_SECRET,
	session: {
		strategy: "jwt"
	},
	pages: {
		signIn: "/sign-in"
	},
	providers: [
		CredentialsProvider({
			name: "credentials",
			credentials: {
				email: { label: "Email", type: "email" },
				password: { label: "Password", type: "password" }
			},
			async authorize(credentials) {
				// For now, just return null to avoid the argon2 import
				// This will be handled by API routes instead
				return null
			}
		}),
		// Google OAuth (optional)
		...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
			? [
					GoogleProvider({
						clientId: env.GOOGLE_CLIENT_ID as string,
						clientSecret: env.GOOGLE_CLIENT_SECRET as string
					})
				]
			: [])
	],
	callbacks: {
		async jwt({ token, user }: any) {
			if (user) {
				token.id = user.id
				token.role = user.role
			}
			return token
		},
		async session({ session, token }: any) {
			if (token) {
				session.user.id = token.id as string
				session.user.role = token.role as string
			}
			return session
		}
	}
}

const authInstance = NextAuth(authOptions)
export const handlers = authInstance.handlers
export const auth = authInstance.auth
export const signIn = authInstance.signIn as any
export const signOut = authInstance.signOut as any
