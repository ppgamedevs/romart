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
    case "DIGITAL_FILE":
      return `private/digital/${entityId}/${cuid}.${extension}`
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
  
  if (scope === "KYC_DOC" || scope === "DIGITAL_FILE" || isPrivate) {
    return config.privateBucket
  }
  
  return config.publicBucket
}

// Utility functions for private storage
export async function uploadToPrivateStorage(key: string, buffer: Buffer, contentType: string): Promise<void> {
  const config = getStorageConfig()
  // For direct uploads, we'll use a different approach
  // This is a simplified version - in production you might want to use presignUpload
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3")
  
  const client = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId!,
      secretAccessKey: config.secretAccessKey!,
    },
    forcePathStyle: config.forcePathStyle,
  })
  
  const command = new PutObjectCommand({
    Bucket: config.privateBucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  })
  
  await client.send(command)
}

export async function getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const config = getStorageConfig()
  const result = await storage.getSignedUrl(key, config.privateBucket, expiresIn)
  return result.url
}

// Presigned upload URL for direct uploads
export async function createPresignedUploadUrl(options: {
  key: string
  contentType: string
  maxSizeBytes?: number
}): Promise<{ url: string; expiresAt: Date }> {
  const config = getStorageConfig()
  const result = await storage.createPresignedUploadUrl(
    options.key,
    config.privateBucket,
    options.contentType,
    options.maxSizeBytes
  )
  return {
    url: result.url,
    expiresAt: result.expiresAt
  }
}

// Signed download URL for private files
export async function getSignedDownloadUrl(options: {
  key: string
  expiresIn?: number
}): Promise<string> {
  const config = getStorageConfig()
  const result = await storage.getSignedDownloadUrl(
    options.key,
    config.privateBucket,
    options.expiresIn || 3600
  )
  return result.url
}

// Alias for backward compatibility
export const createSignedDownloadUrl = getSignedDownloadUrl

// Delete file from storage
export async function deleteFromStorage(key: string, bucket?: string): Promise<void> {
  const config = getStorageConfig()
  const targetBucket = bucket || config.privateBucket
  await storage.delete(key, targetBucket)
}
