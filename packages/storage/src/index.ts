export * from "./types"
export * from "./env"

import { getStorageConfig } from "./env"
import { S3StorageClient } from "./s3"
import { SupabaseStorageClient } from "./supabase"
import { StorageClient, StorageConfig } from "./types"

export function createStorage(config?: StorageConfig): StorageClient {
  const storageConfig = config || getStorageConfig()
  
  switch (storageConfig.provider) {
    case "S3":
    case "R2":
      return new S3StorageClient(storageConfig)
    case "SUPABASE":
      return new SupabaseStorageClient(storageConfig)
    default:
      throw new Error(`Unsupported storage provider: ${storageConfig.provider}`)
  }
}

// Default storage instance
export const storage = createStorage()

// Utility functions for key generation
export function generateImageKey(scope: string, entityId: string, cuid: string, extension: string): string {
  const timestamp = Date.now()
  
  switch (scope) {
    case "ARTIST_AVATAR":
      return `public/artist/${entityId}/avatar/${cuid}.${extension}`
    case "ARTIST_COVER":
      return `public/artist/${entityId}/cover/${cuid}.${extension}`
    case "ARTWORK_IMAGE":
      return `public/artwork/${entityId}/orig/${cuid}.${extension}`
    case "KYC_DOC":
      return `private/kyc/${entityId}/${cuid}.${extension}`
    default:
      throw new Error(`Unknown scope: ${scope}`)
  }
}

export function generateVariantKey(originalKey: string, variant: string): string {
  // Replace /orig/ with /{variant}/ for artwork variants
  return originalKey.replace("/orig/", `/${variant}/`)
}

export function getBucketForScope(scope: string, isPrivate: boolean = false): string {
  const config = getStorageConfig()
  
  if (scope === "KYC_DOC" || isPrivate) {
    return config.privateBucket
  }
  
  return config.publicBucket
}
