# Cloudflare R2 Storage Setup Guide

This guide will help you set up Cloudflare R2 storage for the RomArt image upload system.

## Prerequisites

1. Cloudflare account
2. Access to Cloudflare R2 (Object Storage)
3. Domain configured in Cloudflare (for custom domain)

## Step 1: Create R2 Buckets

### 1.1 Access Cloudflare Dashboard
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your account
3. Navigate to **R2 Object Storage** in the left sidebar

### 1.2 Create Public Bucket
1. Click **Create bucket**
2. Name: `romart-public`
3. Location: Choose closest to your users (e.g., `Europe (Frankfurt)`)
4. Click **Create bucket**

### 1.3 Create Private Bucket
1. Click **Create bucket** again
2. Name: `romart-private`
3. Location: Same as public bucket
4. Click **Create bucket**

## Step 2: Configure Bucket Settings

### 2.1 Public Bucket Configuration
1. Click on `romart-public` bucket
2. Go to **Settings** tab
3. **Public bucket**: Enable this option
4. **Custom domain**: Add your domain (e.g., `cdn.yourdomain.com`)
5. Save settings

### 2.2 Private Bucket Configuration
1. Click on `romart-private` bucket
2. Go to **Settings** tab
3. **Public bucket**: Keep disabled (this is for KYC documents)
4. Save settings

## Step 3: Create API Token

### 3.1 Create R2 API Token
1. Go to **My Profile** → **API Tokens**
2. Click **Create Token**
3. Select **Custom token**
4. Configure permissions:
   - **Account Resources**: Include → All accounts
   - **Zone Resources**: Include → All zones
   - **Permissions**:
     - Account: Cloudflare R2:Edit
     - Zone: Cloudflare R2:Edit
5. Click **Continue to summary**
6. Click **Create Token**
7. **Save the token securely** - you won't see it again!

## Step 4: Get R2 Credentials

### 4.1 Access R2 API Tokens
1. Go to **R2 Object Storage**
2. Click **Manage R2 API tokens**
3. Click **Create API token**
4. Name: `romart-storage`
5. Permissions: **Object Read & Write**
6. Click **Create API token**
7. **Save the Access Key ID and Secret Access Key**

## Step 5: Configure Environment Variables

Add these environment variables to your `.env` file:

```env
# Storage Configuration
STORAGE_PROVIDER=R2

# Cloudflare R2 Configuration
S3_REGION=auto
S3_BUCKET=romart-public
S3_PRIVATE_BUCKET=romart-private
S3_ACCESS_KEY_ID=your_access_key_id_here
S3_SECRET_ACCESS_KEY=your_secret_access_key_here
S3_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
S3_FORCE_PATH_STYLE=false

# CDN Configuration (if using custom domain)
CDN_PUBLIC_URL=https://cdn.yourdomain.com

# Upload Constraints
MAX_UPLOAD_MB=25

# Watermark Configuration
WATERMARK_ENABLED=true
WATERMARK_TEXT=RomArt
WATERMARK_OPACITY=0.30
```

## Step 6: Configure Custom Domain (Optional)

### 6.1 Add DNS Record
1. Go to **DNS** in your Cloudflare dashboard
2. Add a CNAME record:
   - Name: `cdn`
   - Target: `your_account_id.r2.cloudflarestorage.com`
   - Proxy status: Proxied (orange cloud)

### 6.2 Configure R2 Custom Domain
1. Go to your `romart-public` bucket
2. Settings → Custom domain
3. Add: `cdn.yourdomain.com`
4. Save

## Step 7: Test Configuration

### 7.1 Test Upload
```bash
# Test the upload endpoint
curl -X POST http://localhost:3004/uploads/presign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "scope": "ARTIST_AVATAR",
    "contentType": "image/jpeg",
    "size": 1024000
  }'
```

### 7.2 Verify File Upload
1. Check your R2 bucket in Cloudflare dashboard
2. Verify files are being uploaded to correct paths
3. Test public URL access

## Step 8: Security Considerations

### 8.1 CORS Configuration
If needed, configure CORS for your buckets:

```json
[
  {
    "AllowedOrigins": ["https://yourdomain.com"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }
]
```

### 8.2 Bucket Policies
- Public bucket: Allow public read access
- Private bucket: Restrict access to authenticated users only

## Troubleshooting

### Common Issues

1. **403 Forbidden**: Check API token permissions
2. **Invalid endpoint**: Verify account ID in endpoint URL
3. **CORS errors**: Configure CORS settings in bucket
4. **Upload failures**: Check file size limits and content types

### Debug Commands

```bash
# Check environment variables
echo $STORAGE_PROVIDER
echo $S3_ENDPOINT

# Test R2 connectivity
curl -I https://your_account_id.r2.cloudflarestorage.com
```

## Cost Optimization

### R2 Pricing (as of 2024)
- Storage: $0.015 per GB/month
- Class A operations (writes): $4.50 per million
- Class B operations (reads): $0.36 per million
- Data transfer: Free (no egress fees)

### Optimization Tips
1. Use appropriate image sizes
2. Implement caching headers
3. Use CDN for frequently accessed images
4. Monitor usage in Cloudflare dashboard

## Next Steps

1. Configure image processing with Sharp
2. Set up automatic image variants (XL, LG, MD, SM, THUMB)
3. Implement watermarking
4. Set up monitoring and alerts
5. Configure backup strategies

## Support

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [R2 API Reference](https://developers.cloudflare.com/r2/api/)
- [Cloudflare Support](https://support.cloudflare.com/)
