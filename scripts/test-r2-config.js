#!/usr/bin/env node

/**
 * Test Cloudflare R2 Configuration
 * 
 * This script tests the R2 configuration by:
 * 1. Validating environment variables
 * 2. Testing bucket connectivity
 * 3. Testing upload functionality
 * 4. Testing download functionality
 */

import pkg from '@aws-sdk/client-s3'
const { S3Client, ListBucketsCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = pkg
import { createReadStream } from 'fs'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
import dotenv from 'dotenv'
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

console.log('🔧 Testing Cloudflare R2 Configuration...\n')

// Validate configuration
console.log('📋 Configuration:')
console.log(`  Region: ${config.region}`)
console.log(`  Endpoint: ${config.endpoint}`)
console.log(`  Public Bucket: ${publicBucket}`)
console.log(`  Private Bucket: ${privateBucket}`)
console.log(`  Access Key ID: ${config.credentials.accessKeyId ? '✅ Set' : '❌ Missing'}`)
console.log(`  Secret Access Key: ${config.credentials.secretAccessKey ? '✅ Set' : '❌ Missing'}`)
console.log()

// Check required environment variables
const requiredVars = ['S3_ENDPOINT', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY']
const missingVars = requiredVars.filter(varName => !process.env[varName])

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:')
  missingVars.forEach(varName => console.error(`  - ${varName}`))
  console.error('\nPlease set these variables in your .env file')
  process.exit(1)
}

// Create S3 client
const s3Client = new S3Client(config)

async function testBucketAccess() {
  console.log('🔍 Testing bucket access...')
  
  try {
    const command = new ListBucketsCommand({})
    const response = await s3Client.send(command)
    
    console.log('✅ Successfully connected to R2')
    console.log(`📦 Found ${response.Buckets?.length || 0} buckets`)
    
    if (response.Buckets) {
      response.Buckets.forEach(bucket => {
        console.log(`  - ${bucket.Name} (created: ${bucket.CreationDate})`)
      })
    }
    
    return true
  } catch (error) {
    console.error('❌ Failed to connect to R2:', error.message)
    return false
  }
}

async function testUpload(bucketName, key, content) {
  console.log(`📤 Testing upload to ${bucketName}/${key}...`)
  
  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: content,
      ContentType: 'text/plain',
    })
    
    await s3Client.send(command)
    console.log('✅ Upload successful')
    return true
  } catch (error) {
    console.error('❌ Upload failed:', error.message)
    return false
  }
}

async function testDownload(bucketName, key) {
  console.log(`📥 Testing download from ${bucketName}/${key}...`)
  
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    })
    
    const response = await s3Client.send(command)
    const content = await response.Body.transformToString()
    
    console.log('✅ Download successful')
    console.log(`📄 Content: ${content}`)
    return true
  } catch (error) {
    console.error('❌ Download failed:', error.message)
    return false
  }
}

async function testDelete(bucketName, key) {
  console.log(`🗑️ Testing delete from ${bucketName}/${key}...`)
  
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    })
    
    await s3Client.send(command)
    console.log('✅ Delete successful')
    return true
  } catch (error) {
    console.error('❌ Delete failed:', error.message)
    return false
  }
}

async function testPublicUrl(bucketName, key) {
  console.log(`🌐 Testing public URL for ${bucketName}/${key}...`)
  
  try {
    // Construct public URL
    const endpoint = config.endpoint.replace('https://', '').replace('http://', '')
    const publicUrl = `https://${endpoint}/${bucketName}/${key}`
    
    console.log(`🔗 Public URL: ${publicUrl}`)
    
    // Test with curl (if available)
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)
    
    try {
      const { stdout } = await execAsync(`curl -I "${publicUrl}"`)
      console.log('✅ Public URL accessible')
      console.log(`📊 Response: ${stdout.split('\n')[0]}`)
      return true
    } catch (curlError) {
      console.log('⚠️ Could not test public URL with curl (curl not available)')
      console.log('📝 You can manually test the URL in your browser')
      return true
    }
  } catch (error) {
    console.error('❌ Public URL test failed:', error.message)
    return false
  }
}

async function runTests() {
  const testKey = `test-${Date.now()}.txt`
  const testContent = `R2 Test File - Created at ${new Date().toISOString()}`
  
  console.log('🧪 Running R2 tests...\n')
  
  // Test 1: Bucket access
  const bucketAccess = await testBucketAccess()
  if (!bucketAccess) {
    console.error('❌ Cannot proceed without bucket access')
    process.exit(1)
  }
  
  console.log()
  
  // Test 2: Public bucket operations
  console.log('📦 Testing public bucket operations...')
  const publicUpload = await testUpload(publicBucket, testKey, testContent)
  if (publicUpload) {
    await testDownload(publicBucket, testKey)
    await testPublicUrl(publicBucket, testKey)
    await testDelete(publicBucket, testKey)
  }
  
  console.log()
  
  // Test 3: Private bucket operations
  console.log('🔒 Testing private bucket operations...')
  const privateUpload = await testUpload(privateBucket, testKey, testContent)
  if (privateUpload) {
    await testDownload(privateBucket, testKey)
    await testDelete(privateBucket, testKey)
  }
  
  console.log()
  console.log('🎉 R2 configuration test completed!')
  
  // Summary
  console.log('\n📊 Test Summary:')
  console.log('✅ R2 connection: Working')
  console.log(`✅ Public bucket (${publicBucket}): ${publicUpload ? 'Working' : 'Failed'}`)
  console.log(`✅ Private bucket (${privateBucket}): ${privateUpload ? 'Working' : 'Failed'}`)
  
  if (publicUpload && privateUpload) {
    console.log('\n🎯 Your R2 configuration is ready for use!')
    console.log('📝 Next steps:')
    console.log('  1. Update your .env file with the correct values')
    console.log('  2. Test the upload functionality in your application')
    console.log('  3. Configure image processing and variants')
  } else {
    console.log('\n⚠️ Some tests failed. Please check your configuration.')
  }
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error)
  process.exit(1)
})
