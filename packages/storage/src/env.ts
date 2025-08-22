import { z } from "zod"
import { StorageConfig, StorageProvider } from "./types"

const storageEnvSchema = z.object({
  STORAGE_PROVIDER: z.enum(["S3", "R2", "SUPABASE"]).default("S3"),
  
  // S3 / R2 configuration
  S3_REGION: z.string().optional(),
  S3_BUCKET: z.string().default("romart-public"),
  S3_PRIVATE_BUCKET: z.string().default("romart-private"),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_FORCE_PATH_STYLE: z.string().optional(),
  
  // Supabase configuration
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_BUCKET_PUBLIC: z.string().default("romart-public"),
  SUPABASE_BUCKET_PRIVATE: z.string().default("romart-private"),
  
  // CDN configuration
  CDN_PUBLIC_URL: z.string().optional(),
  
  // Upload constraints
  MAX_UPLOAD_MB: z.string().transform(Number).default("25"),
  
  // Watermark configuration
  WATERMARK_ENABLED: z.string().transform(val => val === "true").default("true"),
  WATERMARK_TEXT: z.string().default("RomArt"),
  WATERMARK_OPACITY: z.string().transform(Number).default("0.30"),
})

export function getStorageConfig(): StorageConfig {
  const env = storageEnvSchema.parse(process.env)
  
  return {
    provider: env.STORAGE_PROVIDER as StorageProvider,
    region: env.S3_REGION,
    publicBucket: env.STORAGE_PROVIDER === "SUPABASE" ? env.SUPABASE_BUCKET_PUBLIC : env.S3_BUCKET,
    privateBucket: env.STORAGE_PROVIDER === "SUPABASE" ? env.SUPABASE_BUCKET_PRIVATE : env.S3_PRIVATE_BUCKET,
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    endpoint: env.S3_ENDPOINT,
    forcePathStyle: env.S3_FORCE_PATH_STYLE === "true",
    supabaseUrl: env.SUPABASE_URL,
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    cdnPublicUrl: env.CDN_PUBLIC_URL,
    maxUploadMB: env.MAX_UPLOAD_MB,
    watermark: {
      enabled: env.WATERMARK_ENABLED,
      text: env.WATERMARK_TEXT,
      opacity: env.WATERMARK_OPACITY,
    },
  }
}
