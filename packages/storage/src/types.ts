export type StorageProvider = "S3" | "R2" | "SUPABASE"

export interface PutParams {
  key: string
  bucket: string
  contentType: string
  cacheControl?: string
  acl?: string
  body: Buffer | string
}

export interface PresignPostParams {
  key: string
  bucket: string
  contentType: string
  maxSizeMB: number
  expiresIn?: number
}

export interface PresignPostResult {
  url: string
  fields: Record<string, string>
  key: string
  bucket: string
}

export interface SignedUrlResult {
  url: string
  expiresAt: Date
}

export interface StorageConfig {
  provider: StorageProvider
  region?: string
  publicBucket: string
  privateBucket: string
  accessKeyId?: string
  secretAccessKey?: string
  endpoint?: string
  forcePathStyle?: boolean
  supabaseUrl?: string
  supabaseServiceRoleKey?: string
  cdnPublicUrl?: string
  maxUploadMB: number
  watermark: {
    enabled: boolean
    text: string
    opacity: number
  }
}

export interface StorageClient {
  presignUpload(params: PresignPostParams): Promise<PresignPostResult>
  finalizeUpload(key: string, bucket: string): Promise<void>
  delete(key: string, bucket: string): Promise<void>
  getSignedUrl(key: string, bucket: string, expiresIn?: number): Promise<SignedUrlResult>
  getPublicUrl(key: string): string
  headObject(key: string, bucket: string): Promise<{ exists: boolean; size?: number; contentType?: string }>
  getObjectStream(key: string, bucket: string): Promise<NodeJS.ReadableStream>
  getSignedDownloadUrl(key: string, bucket: string, expiresIn?: number): Promise<SignedUrlResult>
}

export type ImageScope = "ARTIST_AVATAR" | "ARTIST_COVER" | "ARTWORK_IMAGE" | "KYC_DOC"

export interface ImageVariant {
  url: string
  width: number
  height: number
  bytes: number
  format: string
}

export interface ImageVariants {
  xl?: ImageVariant
  lg?: ImageVariant
  md?: ImageVariant
  sm?: ImageVariant
  thumb?: ImageVariant
}

// Key structure documentation
export const KEY_STRUCTURES = {
  ARTIST_AVATAR: "public/artist/{artistId}/avatar/{cuid}.{ext}",
  ARTIST_COVER: "public/artist/{artistId}/cover/{cuid}.{ext}",
  ARTWORK_IMAGE: "public/artwork/{artworkId}/orig/{cuid}.{ext}",
  ARTWORK_VARIANTS: "public/artwork/{artworkId}/{variant}/{cuid}.{ext}",
  KYC_DOC: "private/kyc/{artistId}/{type}/{cuid}.{ext}"
} as const
