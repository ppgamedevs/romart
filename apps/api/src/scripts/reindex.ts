import "dotenv/config";
import { reindexAllArtworks } from "../searchSync";

async function main() {
  try {
    console.log("🔄 Starting reindex of all artworks...");
    
    const count = await reindexAllArtworks();
    
    console.log(`✅ Successfully reindexed ${count} artworks`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Reindex failed:", error);
    process.exit(1);
  }
}

main();
