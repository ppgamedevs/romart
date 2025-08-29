import { PrismaClient } from "@prisma/client";

// Use direct URL for API to avoid pooler issues
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL?.replace('pooler.', 'db.')
    }
  }
});

async function main() {
  console.log("Running additional search indexes...");
  
  try {
    // Additional indexes for Search 2.1
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS searchitem_minprice_idx ON "search_items"("minPriceMinor");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS searchitem_boost_idx ON "search_items"((round(("boostScore")::numeric,2)));`;
    
    console.log("✅ Additional search indexes applied successfully!");
  } catch (error) {
    console.error("❌ Error applying additional search indexes:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
