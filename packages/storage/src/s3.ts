import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3"
import { createPresignedPost } from "@aws-sdk/s3-presigned-post"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { StorageConfig, StorageClient, PresignPostParams, PresignPostResult, SignedUrlResult, PutParams } from "./types"

export class S3StorageClient implements StorageClient {
  private client: S3Client
  private config: StorageConfig

  constructor(config: StorageConfig) {
    this.config = config
    
    this.client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId!,
        secretAccessKey: config.secretAccessKey!,
      },
      endpoint: config.endpoint,
      forcePathStyle: config.forcePathStyle,
    })
  }

  async presignUpload(params: PresignPostParams): Promise<PresignPostResult> {
    const { key, bucket, contentType, maxSizeMB, expiresIn = 3600 } = params

    const { url, fields } = await createPresignedPost(this.client, {
      Bucket: bucket,
      Key: key,
      Conditions: [
        ["content-length-range", 0, maxSizeMB * 1024 * 1024],
        ["starts-with", "$Content-Type", contentType.split("/")[0]],
      ],
      Fields: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
      Expires: expiresIn,
    })

    return {
      url,
      fields,
      key,
      bucket,
    }
  }

  async putObject(params: PutParams): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: params.bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
      CacheControl: params.cacheControl || "public, max-age=31536000, immutable",
      ACL: (params.acl || "public-read") as any,
    })

    await this.client.send(command)
  }

  async delete(key: string, bucket: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })

    await this.client.send(command)
  }

  async getSignedUrl(key: string, bucket: string, expiresIn: number = 3600): Promise<SignedUrlResult> {
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    })

    const url = await getSignedUrl(this.client, command, { expiresIn })
    const expiresAt = new Date(Date.now() + expiresIn * 1000)

    return { url, expiresAt }
  }

  async headObject(key: string, bucket: string): Promise<{ exists: boolean; size?: number; contentType?: string }> {
    try {
      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      })

      const response = await this.client.send(command)
      
      return {
        exists: true,
        size: response.ContentLength,
        contentType: response.ContentType,
      }
    } catch (error: any) {
      if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
        return { exists: false }
      }
      throw error
    }
  }

  getPublicUrl(key: string): string {
    if (this.config.cdnPublicUrl) {
      return `${this.config.cdnPublicUrl}/${key}`
    }
    
    // Fallback to S3 URL
    if (this.config.endpoint) {
      // R2 or other S3-compatible
      return `${this.config.endpoint}/${this.config.publicBucket}/${key}`
    }
    
    // AWS S3
    return `https://${this.config.publicBucket}.s3.${this.config.region}.amazonaws.com/${key}`
  }

  async finalizeUpload(key: string, bucket: string): Promise<void> {
    // For S3, the upload is already finalized when the presigned POST is used
    // This method exists for compatibility with other providers
    return Promise.resolve()
  }
}
