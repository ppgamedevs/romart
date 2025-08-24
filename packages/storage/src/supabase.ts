import { createClient } from "@supabase/supabase-js"
import { StorageConfig, StorageClient, PresignPostParams, PresignPostResult, SignedUrlResult, PutParams } from "./types"

export class SupabaseStorageClient implements StorageClient {
  private client: ReturnType<typeof createClient>
  private config: StorageConfig

  constructor(config: StorageConfig) {
    this.config = config
    
    this.client = createClient(config.supabaseUrl!, config.supabaseServiceRoleKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  async presignUpload(params: PresignPostParams): Promise<PresignPostResult> {
    const { key, bucket, contentType, maxSizeMB } = params

    // For Supabase, we'll use a different approach since presigned POST URLs
    // might not be available. We'll return a special format that the API can handle
    return {
      url: `/api/uploads/supabase-upload`, // This will be handled by our API
      fields: {
        key,
        bucket,
        contentType,
        maxSize: (maxSizeMB * 1024 * 1024).toString(),
      },
      key,
      bucket,
    }
  }

  async putObject(params: PutParams): Promise<void> {
    const { data, error } = await this.client.storage
      .from(params.bucket)
      .upload(params.key, params.body, {
        contentType: params.contentType,
        cacheControl: params.cacheControl || "public, max-age=31536000, immutable",
        upsert: true,
      })

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`)
    }
  }

  async delete(key: string, bucket: string): Promise<void> {
    const { error } = await this.client.storage
      .from(bucket)
      .remove([key])

    if (error) {
      throw new Error(`Supabase delete failed: ${error.message}`)
    }
  }

  async getSignedUrl(key: string, bucket: string, expiresIn: number = 3600): Promise<SignedUrlResult> {
    const { data, error } = await this.client.storage
      .from(bucket)
      .createSignedUrl(key, expiresIn)

    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`)
    }

    return {
      url: data.signedUrl,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    }
  }

  getPublicUrl(key: string): string {
    const { data } = this.client.storage
      .from(this.config.publicBucket)
      .getPublicUrl(key)

    return data.publicUrl
  }

  async headObject(key: string, bucket: string): Promise<{ exists: boolean; size?: number; contentType?: string }> {
    try {
      const { data, error } = await this.client.storage
        .from(bucket)
        .list("", {
          search: key,
        })

      if (error) {
        throw error
      }

      const file = data?.find(f => f.name === key)
      if (!file) {
        return { exists: false }
      }

      return {
        exists: true,
        size: file.metadata?.size,
        contentType: file.metadata?.mimetype,
      }
    } catch (error) {
      return { exists: false }
    }
  }

  async finalizeUpload(key: string, bucket: string): Promise<void> {
    // For Supabase, the upload is finalized when putObject is called
    // This method exists for compatibility
    return Promise.resolve()
  }

  async getObjectStream(key: string, bucket: string): Promise<NodeJS.ReadableStream> {
    const { data, error } = await this.client.storage
      .from(bucket)
      .download(key)

    if (error) {
      throw new Error(`Failed to download object: ${error.message}`)
    }

    if (!data) {
      throw new Error("Object data is empty")
    }

    // Convert Blob to ReadableStream
    return data.stream() as unknown as NodeJS.ReadableStream
  }

  async getSignedDownloadUrl(key: string, bucket: string, expiresIn: number = 3600): Promise<SignedUrlResult> {
    return this.getSignedUrl(key, bucket, expiresIn)
  }
}
