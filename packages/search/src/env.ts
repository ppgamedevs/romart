import { z } from "zod";

const MeiliEnvSchema = z.object({
  MEILI_HOST: z.string().url().default("http://localhost:7700"),
  MEILI_MASTER_KEY: z.string().min(1).optional(),
  MEILI_SEARCH_KEY: z.string().min(1).optional(),
  MEILI_INDEX_ARTWORKS: z.string().default("artworks_v1"),
});

export const meiliEnv = MeiliEnvSchema.parse({
  MEILI_HOST: process.env.MEILI_HOST,
  MEILI_MASTER_KEY: process.env.MEILI_MASTER_KEY,
  MEILI_SEARCH_KEY: process.env.MEILI_SEARCH_KEY,
  MEILI_INDEX_ARTWORKS: process.env.MEILI_INDEX_ARTWORKS,
});

export type MeiliEnv = z.infer<typeof MeiliEnvSchema>;

// Check if Meilisearch is available
export function isMeilisearchAvailable(): boolean {
  return !!(meiliEnv.MEILI_HOST && (meiliEnv.MEILI_SEARCH_KEY || meiliEnv.MEILI_MASTER_KEY));
}
