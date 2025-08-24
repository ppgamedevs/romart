import { MeiliSearch } from "meilisearch";
import { meiliEnv, isMeilisearchAvailable } from "./env";

let adminClient: MeiliSearch | null = null;
let searchClient: MeiliSearch | null = null;

export function getAdminClient(): MeiliSearch {
  if (!isMeilisearchAvailable()) {
    throw new Error("Meilisearch is not available. Please check your environment variables.");
  }

  if (!meiliEnv.MEILI_MASTER_KEY) {
    throw new Error("MEILI_MASTER_KEY is required for admin operations");
  }

  if (!adminClient) {
    adminClient = new MeiliSearch({
      host: meiliEnv.MEILI_HOST,
      apiKey: meiliEnv.MEILI_MASTER_KEY,
    });
  }

  return adminClient;
}

export function getSearchClient(): MeiliSearch {
  if (!isMeilisearchAvailable()) {
    throw new Error("Meilisearch is not available. Please check your environment variables.");
  }

  if (!searchClient) {
    const apiKey = meiliEnv.MEILI_SEARCH_KEY || meiliEnv.MEILI_MASTER_KEY;
    
    if (!apiKey) {
      throw new Error("Either MEILI_SEARCH_KEY or MEILI_MASTER_KEY is required");
    }

    searchClient = new MeiliSearch({
      host: meiliEnv.MEILI_HOST,
      apiKey,
    });
  }

  return searchClient;
}

export function getArtworksIndex() {
  const client = getSearchClient();
  return client.index(meiliEnv.MEILI_INDEX_ARTWORKS);
}

export function getArtworksIndexAdmin() {
  const client = getAdminClient();
  return client.index(meiliEnv.MEILI_INDEX_ARTWORKS);
}
