#!/usr/bin/env node

/**
 * Cloudflare R2 Setup Helper
 * 
 * This script helps you configure R2 environment variables
 * by prompting for the necessary values and creating/updating .env file
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import readline from 'readline'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function setupR2() {
  console.log('🚀 Cloudflare R2 Setup Helper\n')
  console.log('This script will help you configure R2 environment variables.')
  console.log('Make sure you have your R2 credentials ready.\n')

  // Get R2 credentials
  const accessKeyId = await question('Enter your R2 Access Key ID: ')
  const secretAccessKey = await question('Enter your R2 Secret Access Key: ')
  const accountId = await question('Enter your Cloudflare Account ID: ')
  
  // Get bucket names
  const publicBucket = await question('Enter public bucket name (default: romart-public): ') || 'romart-public'
  const privateBucket = await question('Enter private bucket name (default: romart-private): ') || 'romart-private'
  
  // Get custom domain (optional)
  const customDomain = await question('Enter custom CDN domain (optional, e.g., cdn.yourdomain.com): ')
  
  // Build environment variables
  const envVars = [
    '# Cloudflare R2 Configuration',
    'STORAGE_PROVIDER=R2',
    'S3_REGION=auto',
    `S3_BUCKET=${publicBucket}`,
    `S3_PRIVATE_BUCKET=${privateBucket}`,
    `S3_ACCESS_KEY_ID=${accessKeyId}`,
    `S3_SECRET_ACCESS_KEY=${secretAccessKey}`,
    `S3_ENDPOINT=https://${accountId}.r2.cloudflarestorage.com`,
    'S3_FORCE_PATH_STYLE=false',
    '',
    '# Upload Constraints',
    'MAX_UPLOAD_MB=25',
    '',
    '# Watermark Configuration',
    'WATERMARK_ENABLED=true',
    'WATERMARK_TEXT=RomArt',
    'WATERMARK_OPACITY=0.30'
  ]

  if (customDomain) {
    envVars.push('', '# CDN Configuration', `CDN_PUBLIC_URL=https://${customDomain}`)
  }

  const envContent = envVars.join('\n')

  // Check if .env file exists
  const envPath = join(__dirname, '..', '.env')
  let existingContent = ''
  
  if (existsSync(envPath)) {
    existingContent = readFileSync(envPath, 'utf8')
    console.log('\n📄 Existing .env file found. Will append R2 configuration.')
  }

  // Write to .env file
  const newContent = existingContent + '\n\n' + envContent
  writeFileSync(envPath, newContent)

  console.log('\n✅ R2 configuration added to .env file!')
  console.log('\n📋 Configuration summary:')
  console.log(`  Public Bucket: ${publicBucket}`)
  console.log(`  Private Bucket: ${privateBucket}`)
  console.log(`  Endpoint: https://${accountId}.r2.cloudflarestorage.com`)
  if (customDomain) {
    console.log(`  CDN Domain: ${customDomain}`)
  }
  
  console.log('\n🔧 Next steps:')
  console.log('1. Create the buckets in Cloudflare R2 dashboard')
  console.log('2. Configure bucket settings (public/private)')
  console.log('3. Test the configuration: npm run test:r2')
  console.log('4. Start your application and test uploads')

  rl.close()
}

setupR2().catch(error => {
  console.error('❌ Setup failed:', error)
  rl.close()
  process.exit(1)
})
