import { prisma } from "@artfromromania/db";
import { toSearchDoc, indexOne, deleteOne, reindexAll } from "@artfromromania/search";
import type { SearchArtworkDoc } from "@artfromromania/search";

export async function fetchArtworkForSearch(artworkId: string) {
  return await prisma.artwork.findUnique({
    where: { id: artworkId },
    include: {
      artist: {
        select: {
          id: true,
          displayName: true,
          slug: true,
          shadowbanned: true,
        },
      },
      images: {
        select: {
          url: true,
          position: true,
        },
        orderBy: { position: "asc" },
      },
      editions: {
        select: {
          type: true,
          unitAmount: true,
          currency: true,
        },
        orderBy: { unitAmount: "asc" },
      },
    },
  });
}

export async function syncArtwork(artworkId: string) {
  try {
    const artwork = await fetchArtworkForSearch(artworkId);
    
    if (!artwork) {
      // Artwork doesn't exist, delete from search index
      await deleteOne(artworkId);
      return;
    }

    if (artwork.status === "PUBLISHED" && artwork.publishedAt) {
      // Artwork is published, index it
      const searchDoc = toSearchDoc(artwork as any);
      if (searchDoc) {
        await indexOne(searchDoc);
      } else {
        // Artwork was filtered out (rejected/suppressed), remove from index
        await deleteOne(artworkId);
      }
    } else {
      // Artwork is not published, remove from search index
      await deleteOne(artworkId);
    }
  } catch (error) {
    console.error(`Failed to sync artwork ${artworkId}:`, error);
    throw error;
  }
}

export async function reindexAllArtworks(): Promise<number> {
  try {
    const fetcher = async (): Promise<SearchArtworkDoc[]> => {
      const artworks = await prisma.artwork.findMany({
        where: {
          status: "PUBLISHED",
          publishedAt: { not: null },
        },
        include: {
          artist: {
            select: {
              id: true,
              displayName: true,
              slug: true,
              shadowbanned: true,
            },
          },
          images: {
            select: {
              url: true,
              position: true,
            },
            orderBy: { position: "asc" },
          },
          editions: {
            select: {
              type: true,
              unitAmount: true,
              currency: true,
            },
            orderBy: { unitAmount: "asc" },
          },
        },
      });

      return artworks.map((artwork) => toSearchDoc(artwork as any)).filter((doc): doc is SearchArtworkDoc => doc !== null);
    };

    return await reindexAll(fetcher);
  } catch (error) {
    console.error("Failed to reindex all artworks:", error);
    throw error;
  }
}
