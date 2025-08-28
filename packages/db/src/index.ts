import { PrismaClient } from "@prisma/client"
import { env } from "@artfromromania/shared"

declare global {
	// eslint-disable-next-line no-var
	var __prisma: PrismaClient | undefined
}

// Use direct URL to avoid pooler issues
const databaseUrl = process.env.DATABASE_URL?.replace('pooler.', 'db.');

export const prisma = globalThis.__prisma || new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
})

if (process.env.NODE_ENV !== "production") {
	globalThis.__prisma = prisma
}

export { env } from "@artfromromania/shared"
export * from "@prisma/client"
export * from "./queries/artworks"
export * from "./queries/cart"
export * from "./queries/digital-entitlements"
export * from "./queries/payouts"
export * from "./queries/fulfillment"
