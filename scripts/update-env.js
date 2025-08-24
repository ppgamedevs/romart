#!/usr/bin/env node

/**
 * Update .env file with R2 configuration
 */

import { writeFileSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const envPath = join(__dirname, '..', '.env')

const envContent = `# =============================================================================
# RomArt Environment Configuration
# =============================================================================

# Database Configuration
DATABASE_URL="postgresql://postgres:Muierapid33#@db.fybgcqqreebirjwfrrin.supabase.co:5432/postgres?sslmode=require"

# Redis Configuration (for rate limiting and sessions)
UPSTASH_REDIS_REST_URL="https://sterling-burro-9756.upstash.io"
UPSTASH_REDIS_REST_TOKEN="ASYcAAImcDE2ZDJhODkxYzJmYWM0Nzg1OTk4NGI4YmUwMjBhMjg2MHAxOTc1Ng"

# =============================================================================
# Storage Configuration (Cloudflare R2)
# =============================================================================

# Storage Provider: S3, R2, or SUPABASE
STORAGE_PROVIDER=S3

# Cloudflare R2 Configuration
S3_REGION=auto
S3_BUCKET=romart-public
S3_PRIVATE_BUCKET=romart-private
S3_ACCESS_KEY_ID=80fabef9a3e3eaa2c3eaf2fec02b02ac
S3_SECRET_ACCESS_KEY=d4d9d35c69c83709a9df87b43478274b50c56d401a878155ee59daaea4a71763
S3_ENDPOINT=https://77e891d3c39031a8069ebe87d3902e1b.r2.cloudflarestorage.com
S3_FORCE_PATH_STYLE=true

# Upload Constraints
MAX_UPLOAD_MB=25

# Watermark Configuration
WATERMARK_ENABLED=true
WATERMARK_TEXT=RomArt
WATERMARK_OPACITY=0.30

# =============================================================================
# Authentication Configuration
# =============================================================================

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# =============================================================================
# Application Configuration
# =============================================================================

# API Configuration
API_PORT=3004
WEB_PORT=3000

# Environment
NODE_ENV=development
`

try {
  writeFileSync(envPath, envContent)
  console.log('✅ .env file created/updated successfully!')
  console.log('📋 R2 Configuration:')
  console.log('  - Storage Provider: S3 (R2)')
  console.log('  - Public Bucket: romart-public')
  console.log('  - Private Bucket: romart-private')
  console.log('  - Endpoint: https://77e891d3c39031a8069ebe87d3902e1b.r2.cloudflarestorage.com')
  console.log('  - Force Path Style: true')
  console.log('\n🔧 Next steps:')
  console.log('1. Test the configuration: npm run test:r2')
  console.log('2. Start your application and test uploads')
} catch (error) {
  console.error('❌ Failed to create .env file:', error.message)
  process.exit(1)
}
