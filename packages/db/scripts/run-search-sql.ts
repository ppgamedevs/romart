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
  console.log("Running search SQL extensions...");
  
  try {
    // Extensions
    await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS unaccent;`;
    await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS pg_trgm;`;
    
    // Add tsvector column
    await prisma.$executeRaw`ALTER TABLE "search_items" ADD COLUMN IF NOT EXISTS ts tsvector;`;
    
    // Create indexes
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS searchitem_ts_idx ON "search_items" USING GIN (ts);`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS searchitem_trgm_title_idx ON "search_items" USING GIN (title gin_trgm_ops);`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS searchitem_medium_idx ON "search_items"(medium);`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS searchitem_price_idx ON "search_items"(priceMinor);`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS searchitem_published_idx ON "search_items"(publishedAt);`;
    
    // Create function
    await prisma.$executeRaw`
      CREATE OR REPLACE FUNCTION searchitem_build_ts(title text, artist text, tags text[])
      RETURNS tsvector AS $$
        SELECT
          setweight(to_tsvector('simple', unaccent(coalesce(title,''))), 'A') ||
          setweight(to_tsvector('simple', unaccent(coalesce(artist,''))), 'B') ||
          setweight(to_tsvector('simple', unaccent(array_to_string(tags,' '))), 'C');
      $$ LANGUAGE SQL IMMUTABLE;
    `;
    
    // Create trigger function
    await prisma.$executeRaw`
      CREATE OR REPLACE FUNCTION searchitem_refresh_ts() RETURNS trigger AS $$
      BEGIN
        NEW.ts := searchitem_build_ts(NEW.title, NEW.artistName, NEW.tags);
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql;
    `;
    
    // Create trigger
    await prisma.$executeRaw`DROP TRIGGER IF EXISTS trg_searchitem_ts ON "search_items";`;
    await prisma.$executeRaw`
      CREATE TRIGGER trg_searchitem_ts
      BEFORE INSERT OR UPDATE OF title, artistName, tags
      ON "search_items" FOR EACH ROW
      EXECUTE FUNCTION searchitem_refresh_ts();
    `;
    
    console.log("✅ Search SQL extensions applied successfully!");
  } catch (error) {
    console.error("❌ Error applying search SQL extensions:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
