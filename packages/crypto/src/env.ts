import { z } from "zod"

const envSchema = z.object({
  PII_KEY_VERSION: z.string().default("1"),
  PII_ENCRYPTION_KEY_BASE64: z.string(),
  PSEUDONYM_SALT_BASE64: z.string(),
})

export const cryptoConfig = envSchema.parse({
  PII_KEY_VERSION: process.env.PII_KEY_VERSION,
  PII_ENCRYPTION_KEY_BASE64: process.env.PII_ENCRYPTION_KEY_BASE64,
  PSEUDONYM_SALT_BASE64: process.env.PSEUDONYM_SALT_BASE64,
})
