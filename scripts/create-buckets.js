#!/usr/bin/env node

/**
 * Create R2 Buckets
 * 
 * This script creates the required buckets in Cloudflare R2
 */

import pkg from '@aws-sdk/client-s3'
const { S3Client, CreateBucketCommand, PutBucketPublicReadBlockCommand } = pkg
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
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

const publicBucket = process.env.S3_BUCKET || 'romart-public'
const privateBucket = process.env.S3_PRIVATE_BUCKET || 'romart-private'

const s3Client = new S3Client(config)

async function createBucket(bucketName, isPublic = false) {
  console.log(`📦 Creating bucket: ${bucketName} (${isPublic ? 'public' : 'private'})...`)
  
  try {
    // Create the bucket
    const createCommand = new CreateBucketCommand({
      Bucket: bucketName,
    })
    
    await s3Client.send(createCommand)
    console.log(`✅ Bucket ${bucketName} created successfully`)
    
    // For private bucket, block public access
    if (!isPublic) {
      try {
        const blockCommand = new PutBucketPublicReadBlockCommand({
          Bucket: bucketName,
          PublicReadBlockConfiguration: {
            BlockPublicAcls: true,
            IgnorePublicAcls: true,
            BlockPublicPolicy: true,
            RestrictPublicBuckets: true,
          },
        })
        
        await s3Client.send(blockCommand)
        console.log(`🔒 Public access blocked for ${bucketName}`)
      } catch (error) {
        console.log(`⚠️ Could not block public access for ${bucketName}: ${error.message}`)
      }
    }
    
    return true
  } catch (error) {
    if (error.name === 'BucketAlreadyExists') {
      console.log(`ℹ️ Bucket ${bucketName} already exists`)
      return true
    } else {
      console.error(`❌ Failed to create bucket ${bucketName}:`, error.message)
      return false
    }
  }
}

async function createBuckets() {
  console.log('🚀 Creating R2 Buckets...\n')
  
  // Check configuration
  console.log('📋 Configuration:')
  console.log(`  Endpoint: ${config.endpoint}`)
  console.log(`  Public Bucket: ${publicBucket}`)
  console.log(`  Private Bucket: ${privateBucket}`)
  console.log()
  
  // Create public bucket
  const publicSuccess = await createBucket(publicBucket, true)
  
  console.log()
  
  // Create private bucket
  const privateSuccess = await createBucket(privateBucket, false)
  
  console.log()
  
  if (publicSuccess && privateSuccess) {
    console.log('🎉 All buckets created successfully!')
    console.log('\n📝 Next steps:')
    console.log('1. Configure bucket settings in Cloudflare dashboard')
    console.log('2. Test the configuration: npm run test:r2')
    console.log('3. Start your application and test uploads')
  } else {
    console.log('⚠️ Some buckets failed to create. Please check your configuration.')
  }
}

createBuckets().catch(error => {
  console.error('❌ Failed to create buckets:', error)
  process.exit(1)
})
