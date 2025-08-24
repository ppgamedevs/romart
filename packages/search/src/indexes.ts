import { getAdminClient, getArtworksIndexAdmin } from "./client";
import { meiliEnv } from "./env";

export async function ensureIndexes() {
  try {
    const client = getAdminClient();
    const index = getArtworksIndexAdmin();
    
    // Create index if it doesn't exist
    try {
      await client.createIndex(meiliEnv.MEILI_INDEX_ARTWORKS, {
        primaryKey: "id"
      });
    } catch (error: any) {
      // Index might already exist, that's okay
      if (error.code !== 'index_already_exists') {
        throw error;
      }
    }

    // Update settings
    await index.updateSettings({
      searchableAttributes: [
        "title",
        "description", 
        "artistName",
        "category"
      ],
      filterableAttributes: [
        "kind",
        "category", 
        "artistId",
        "framed",
        "year",
        "price"
      ],
      sortableAttributes: [
        "publishedAt",
        "price",
        "popularity"
      ],
      rankingRules: [
        "words",
        "typo", 
        "proximity",
        "attribute",
        "wordsPosition",
        "exactness",
        "desc(publishedAt)",
        "desc(popularity)"
      ],
      synonyms: {
        "painting": ["oil painting", "acrylic", "pictura", "tablou"],
        "drawing": ["sketch", "desen"],
        "photography": ["photo", "fotografie", "foto"],
        "digital": ["digital art", "arta digitala"]
      },
      stopWords: [
        "the", "a", "an", "and", "of", "in",
        "la", "si", "un", "o", "din", "cu"
      ]
    });

    console.log("✅ Meilisearch indexes configured successfully");
  } catch (error) {
    console.error("❌ Failed to configure Meilisearch indexes:", error);
    throw error;
  }
}
