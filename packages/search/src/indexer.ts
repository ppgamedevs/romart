import { getArtworksIndexAdmin } from "./client";
import { isMeilisearchAvailable } from "./env";
import type { SearchArtworkDoc } from "./types";

export async function indexArtworks(docs: SearchArtworkDoc[]) {
  if (!isMeilisearchAvailable()) {
    console.log("⚠️  Meilisearch is not available, skipping indexing");
    return;
  }

  try {
    const index = getArtworksIndexAdmin();
    await index.addDocuments(docs);
    console.log(`✅ Indexed ${docs.length} artworks`);
  } catch (error) {
    console.error("❌ Failed to index artworks:", error);
    throw error;
  }
}

export async function indexOne(doc: SearchArtworkDoc) {
  if (!isMeilisearchAvailable()) {
    console.log("⚠️  Meilisearch is not available, skipping indexing");
    return;
  }

  try {
    const index = getArtworksIndexAdmin();
    await index.addDocuments([doc]);
    console.log(`✅ Indexed artwork: ${doc.title}`);
  } catch (error) {
    console.error("❌ Failed to index artwork:", error);
    throw error;
  }
}

export async function updateOne(doc: SearchArtworkDoc) {
  if (!isMeilisearchAvailable()) {
    console.log("⚠️  Meilisearch is not available, skipping update");
    return;
  }

  try {
    const index = getArtworksIndexAdmin();
    await index.updateDocuments([doc]);
    console.log(`✅ Updated artwork: ${doc.title}`);
  } catch (error) {
    console.error("❌ Failed to update artwork:", error);
    throw error;
  }
}

export async function deleteOne(id: string) {
  if (!isMeilisearchAvailable()) {
    console.log("⚠️  Meilisearch is not available, skipping deletion");
    return;
  }

  try {
    const index = getArtworksIndexAdmin();
    await index.deleteDocument(id);
    console.log(`✅ Deleted artwork: ${id}`);
  } catch (error) {
    console.error("❌ Failed to delete artwork:", error);
    throw error;
  }
}

export async function reindexAll(fetcher: () => Promise<SearchArtworkDoc[]>) {
  if (!isMeilisearchAvailable()) {
    console.log("⚠️  Meilisearch is not available, skipping reindex");
    return 0;
  }

  try {
    const index = getArtworksIndexAdmin();
    
    // Delete all documents
    await index.deleteAllDocuments();
    console.log("🗑️ Cleared existing documents");
    
    // Fetch and index all documents
    const docs = await fetcher();
    await index.addDocuments(docs);
    
    console.log(`✅ Reindexed ${docs.length} artworks`);
    return docs.length;
  } catch (error) {
    console.error("❌ Failed to reindex:", error);
    throw error;
  }
}
