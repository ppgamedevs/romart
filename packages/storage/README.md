# Storage Package

This package provides unified storage abstraction for S3, R2, and Supabase Storage.

## Environment Configuration

Add the following environment variables to your `.env` file:

```bash
# Storage provider: S3 | R2 | SUPABASE
STORAGE_PROVIDER=S3

# S3 / R2 (S3-compatible) configuration
S3_REGION=eu-central-1
S3_BUCKET=romart-public
S3_PRIVATE_BUCKET=romart-private
S3_ACCESS_KEY_ID=your-access-key-id
S3_SECRET_ACCESS_KEY=your-secret-access-key
S3_ENDPOINT= # Leave empty for AWS, set for R2: https://<accountid>.r2.cloudflarestorage.com
S3_FORCE_PATH_STYLE= # Set to "true" for R2, leave empty for AWS

# Supabase configuration (if using Supabase Storage)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_BUCKET_PUBLIC=romart-public
SUPABASE_BUCKET_PRIVATE=romart-private

# CDN public URL (e.g., CloudFront, Cloudflare)
CDN_PUBLIC_URL=https://cdn.romart.example

# Upload constraints
MAX_UPLOAD_MB=25

# Watermark configuration (only for ARTWORK images)
WATERMARK_ENABLED=true
WATERMARK_TEXT=RomArt
WATERMARK_OPACITY=0.30
```

## Usage

```typescript
import { storage, generateImageKey } from "@artfromromania/storage"

// Generate a presigned upload URL
const presignedPost = await storage.presignUpload({
  key: "public/artist/123/avatar/image.jpg",
  bucket: "romart-public",
  contentType: "image/jpeg",
  maxSizeMB: 5
})

// Get a public URL
const publicUrl = storage.getPublicUrl("public/artist/123/avatar/image.jpg")
```

## Key Structure

- **Artist Avatar**: `public/artist/{artistId}/avatar/{cuid}.{ext}`
- **Artist Cover**: `public/artist/{artistId}/cover/{cuid}.{ext}`
- **Artwork Images**: `public/artwork/{artworkId}/orig/{cuid}.{ext}`
- **KYC Documents**: `private/kyc/{artistId}/{cuid}.{ext}`
