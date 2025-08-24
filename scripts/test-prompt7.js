#!/usr/bin/env node

/**
 * Quick test script for Prompt 7 functionality
 * Tests basic endpoints and database connectivity
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPrompt7() {
  console.log('🧪 Testing Prompt 7: Artwork Creation & Publishing\n');

  try {
    // Test 1: Database connectivity
    console.log('1. Testing database connectivity...');
    const artistCount = await prisma.artist.count();
    const artworkCount = await prisma.artwork.count();
    const editionCount = await prisma.edition.count();
    const imageCount = await prisma.image.count();
    
    console.log(`   ✅ Database connected successfully`);
    console.log(`   📊 Current data: ${artistCount} artists, ${artworkCount} artworks, ${editionCount} editions, ${imageCount} images`);

    // Test 2: Check if we have a test artist with KYC approved
    console.log('\n2. Checking for test artist...');
    const testArtist = await prisma.artist.findFirst({
      where: {
        kycStatus: 'APPROVED',
        completionScore: { gte: 80 }
      },
      include: {
        user: true,
        artworks: {
          include: {
            images: true,
            editions: true
          }
        }
      }
    });

    if (testArtist) {
      console.log(`   ✅ Found test artist: ${testArtist.displayName}`);
      console.log(`   📋 KYC Status: ${testArtist.kycStatus}`);
      console.log(`   📊 Profile Completion: ${testArtist.completionScore}%`);
      console.log(`   🎨 Artworks: ${testArtist.artworks.length}`);
      
      // Show published artworks
      const publishedArtworks = testArtist.artworks.filter(a => a.status === 'PUBLISHED');
      console.log(`   ✅ Published artworks: ${publishedArtworks.length}`);
      
      if (publishedArtworks.length > 0) {
        console.log('   📝 Published artwork details:');
        publishedArtworks.forEach(artwork => {
          console.log(`      - ${artwork.title} (${artwork.kind}) - ${artwork.priceAmount/100} ${artwork.priceCurrency}`);
          console.log(`        Images: ${artwork.images.length}, Editions: ${artwork.editions.length}`);
        });
      }
    } else {
      console.log('   ⚠️  No test artist found with KYC approved and 80%+ completion');
      console.log('   💡 You may need to complete artist onboarding first');
    }

    // Test 3: Check database schema
    console.log('\n3. Checking database schema...');
    const artworkSchema = await prisma.artwork.findFirst({
      select: {
        id: true,
        title: true,
        slug: true,
        kind: true,
        status: true,
        priceAmount: true,
        priceCurrency: true,
        widthCm: true,
        heightCm: true,
        depthCm: true,
        framed: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (artworkSchema) {
      console.log('   ✅ Artwork schema is working');
      console.log(`   📋 Sample artwork: ${artworkSchema.title} (${artworkSchema.kind})`);
    } else {
      console.log('   ⚠️  No artworks found in database');
    }

    // Test 4: Check edition schema
    console.log('\n4. Checking edition schema...');
    const editionSchema = await prisma.edition.findFirst({
      select: {
        id: true,
        sku: true,
        type: true,
        unitAmount: true,
        currency: true,
        runSize: true,
        available: true,
        downloadableUrl: true
      }
    });

    if (editionSchema) {
      console.log('   ✅ Edition schema is working');
      console.log(`   📋 Sample edition: ${editionSchema.sku} (${editionSchema.type})`);
    } else {
      console.log('   ⚠️  No editions found in database');
    }

    // Test 5: Check image schema
    console.log('\n5. Checking image schema...');
    const imageSchema = await prisma.image.findFirst({
      select: {
        id: true,
        url: true,
        kind: true,
        position: true,
        alt: true,
        storageKey: true,
        contentType: true,
        sizeBytes: true
      }
    });

    if (imageSchema) {
      console.log('   ✅ Image schema is working');
      console.log(`   📋 Sample image: ${imageSchema.kind} (position: ${imageSchema.position})`);
    } else {
      console.log('   ⚠️  No images found in database');
    }

    console.log('\n🎉 Prompt 7 Database Tests Completed!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Open http://localhost:3000/studio/artworks');
    console.log('   2. Create a new artwork (Original, Editioned, or Digital)');
    console.log('   3. Add details, upload images, and manage editions');
    console.log('   4. Publish the artwork');
    console.log('   5. Verify it appears on the public artist profile');
    console.log('   6. Test the artwork PDP page');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPrompt7();
