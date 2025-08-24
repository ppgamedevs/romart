#!/usr/bin/env node

/**
 * List R2 Buckets
 */

import pkg from '@aws-sdk/client-s3'
const { S3Client, ListBucketsCommand } = pkg
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env') })

const config = {
  region: process.env.S3_REGION || 'auto',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
}

const s3Client = new S3Client(config)

async function listBuckets() {
  console.log('🔍 Listing R2 Buckets...\n')
  
  try {
    const command = new ListBucketsCommand({})
    const response = await s3Client.send(command)
    
    console.log('✅ Successfully connected to R2')
    console.log(`📦 Found ${response.Buckets?.length || 0} buckets:`)
    
    if (response.Buckets && response.Buckets.length > 0) {
      response.Buckets.forEach(bucket => {
        console.log(`  - ${bucket.Name} (created: ${bucket.CreationDate})`)
      })
    } else {
      console.log('  No buckets found')
    }
    
    console.log('\n💡 If no buckets exist, you need to create them manually in the Cloudflare dashboard:')
    console.log('   1. Go to https://dash.cloudflare.com')
    console.log('   2. Navigate to R2 Object Storage')
    console.log('   3. Create buckets: romart-public and romart-private')
    
  } catch (error) {
    console.error('❌ Failed to list buckets:', error.message)
    console.log('\n🔧 Troubleshooting:')
    console.log('   - Check your API credentials')
    console.log('   - Verify the endpoint URL')
    console.log('   - Ensure R2 is enabled in your Cloudflare account')
  }
}

listBuckets().catch(error => {
  console.error('❌ Script failed:', error)
  process.exit(1)
})
