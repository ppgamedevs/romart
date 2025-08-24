import { createCipheriv, randomBytes, createDecipheriv, createHash } from "crypto"
import { cryptoConfig } from "./env"

const key = Buffer.from(cryptoConfig.PII_ENCRYPTION_KEY_BASE64, "base64")
const salt = Buffer.from(cryptoConfig.PSEUDONYM_SALT_BASE64, "base64")

export interface PiiEncryptionResult {
  iv: Buffer
  ciphertext: Buffer
  tag: Buffer
  keyVersion: number
}

export function encryptPII(plain: string): PiiEncryptionResult {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  
  return {
    iv,
    ciphertext: enc,
    tag,
    keyVersion: Number(cryptoConfig.PII_KEY_VERSION)
  }
}

export function decryptPII(iv: Buffer, ciphertext: Buffer, tag: Buffer): string {
  const decipher = createDecipheriv("aes-256-gcm", key, iv)
  decipher.setAuthTag(tag)
  
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8")
}

export function hashIdentifier(value: string): string {
  const hash = createHash("sha256")
  hash.update(salt)
  hash.update(value)
  return hash.digest("hex")
}

export function generatePseudonym(value: string): string {
  return hashIdentifier(value)
}
