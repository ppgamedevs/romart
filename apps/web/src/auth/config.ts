import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@artfromromania/db"
import { verifyPassword } from "@artfromromania/auth"
import { env } from "@artfromromania/shared"

export const authOptions: NextAuthConfig = {
	adapter: PrismaAdapter(prisma),
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
				if (!credentials?.email || !credentials?.password) {
					return null
				}

				const user = await prisma.user.findUnique({
					where: { email: credentials.email as string }
				})

				if (!user || !user.passwordHash) {
					return null
				}

				const isValid = await verifyPassword(credentials.password as string, user.passwordHash)

				if (!isValid) {
					return null
				}

				return {
					id: user.id,
					email: user.email,
					name: user.name,
					role: user.role
				}
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
