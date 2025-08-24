import { prisma } from "../index";
import type { Category, SortOption } from "@artfromromania/shared";

export interface CatalogFilters {
  page?: number;
  pageSize?: number;
  kind?: "ORIGINAL" | "EDITIONED" | "DIGITAL";
  category?: Category;
  priceMin?: number;
  priceMax?: number;
  hasFrame?: boolean;
  year?: number;
  sort?: SortOption;
}

export interface CatalogResult {
  items: Array<{
    id: string;
    slug: string;
    title: string;
    kind: "ORIGINAL" | "EDITIONED" | "DIGITAL";
    priceAmount: number | null;
    priceKind: "artwork" | "edition";
    primaryImageUrl: string | null;
    artist: {
      displayName: string;
      slug: string;
    };
  }>;
  total: number;
  facets: {
    categories: Array<{ category: Category; count: number }>;
    kinds: Array<{ kind: string; count: number }>;
    priceRange: { min: number; max: number };
  };
}

export async function getCatalogPage(filters: CatalogFilters): Promise<CatalogResult> {
  const {
    page = 1,
    pageSize = 12,
    kind,
    category,
    priceMin,
    priceMax,
    hasFrame,
    year,
    sort = "newest"
  } = filters;

  const skip = (page - 1) * pageSize;

  // Build where conditions
  const where: any = {
    publishedAt: { not: null },
    status: "PUBLISHED"
  };

  if (kind) where.kind = kind;
  if (category) where.category = category;
  if (hasFrame !== undefined) where.hasFrame = hasFrame;
  if (year) where.year = year;

  // Price filtering is complex due to different pricing models
  let priceWhere = {};
  if (priceMin !== undefined || priceMax !== undefined) {
    priceWhere = {
      OR: [
        // ORIGINAL artworks with priceAmount
        {
          kind: "ORIGINAL",
          priceAmount: {
            ...(priceMin !== undefined && { gte: priceMin }),
            ...(priceMax !== undefined && { lte: priceMax })
          }
        },
        // EDITIONED/DIGITAL artworks with editions
        {
          kind: { in: ["EDITIONED", "DIGITAL"] },
          editions: {
            some: {
              unitAmount: {
                ...(priceMin !== undefined && { gte: priceMin }),
                ...(priceMax !== undefined && { lte: priceMax })
              }
            }
          }
        }
      ]
    };
  }

  // Build orderBy
  let orderBy: any = {};
  switch (sort) {
    case "newest":
      orderBy = { publishedAt: "desc" };
      break;
    case "price_asc":
      orderBy = [
        { priceAmount: "asc" },
        { editions: { unitAmount: "asc" } }
      ];
      break;
    case "price_desc":
      orderBy = [
        { priceAmount: "desc" },
        { editions: { unitAmount: "desc" } }
      ];
      break;
  }

  // Get total count
  const total = await prisma.artwork.count({
    where: { ...where, ...priceWhere }
  });

  // Get items
  const items = await prisma.artwork.findMany({
    where: { ...where, ...priceWhere },
    select: {
      id: true,
      slug: true,
      title: true,
      kind: true,
      priceAmount: true,
      images: {
        where: { position: 0 },
        select: { url: true },
        take: 1
      },
      artist: {
        select: {
          displayName: true,
          slug: true
        }
      },
      editions: {
        where: { type: { in: ["PRINT", "DIGITAL"] } },
        select: { unitAmount: true },
        orderBy: { unitAmount: "asc" },
        take: 1
      }
    },
    orderBy,
    skip,
    take: pageSize
  });

  // Transform items to include calculated price
  const transformedItems = items.map(item => {
    let priceAmount = item.priceAmount;
    let priceKind: "artwork" | "edition" = "artwork";

    if (item.kind === "ORIGINAL") {
      priceAmount = item.priceAmount;
    } else if (item.editions.length > 0) {
      priceAmount = item.editions[0].unitAmount;
      priceKind = "edition";
    }

    return {
      id: item.id,
      slug: item.slug,
      title: item.title,
      kind: item.kind,
      priceAmount,
      priceKind,
      primaryImageUrl: item.images[0]?.url || null,
      artist: item.artist
    };
  });

  // Get facets
  const [categories, kinds, priceRange] = await Promise.all([
    // Categories
    prisma.artwork.groupBy({
      by: ["category"],
      where: { ...where, ...priceWhere },
      _count: { category: true }
    }),
    // Kinds
    prisma.artwork.groupBy({
      by: ["kind"],
      where: { ...where, ...priceWhere },
      _count: { kind: true }
    }),
    // Price range
    prisma.$queryRaw<Array<{ min: number; max: number }>>`
      SELECT 
        MIN(LEAST(COALESCE(a.price_amount, 999999999), COALESCE(e.min_price, 999999999))) as min,
        MAX(GREATEST(COALESCE(a.price_amount, 0), COALESCE(e.max_price, 0))) as max
      FROM artwork a
      LEFT JOIN (
        SELECT 
          artwork_id,
          MIN(unit_amount) as min_price,
          MAX(unit_amount) as max_price
        FROM edition 
        WHERE type IN ('PRINT', 'DIGITAL')
        GROUP BY artwork_id
      ) e ON a.id = e.artwork_id
      WHERE a.published_at IS NOT NULL AND a.status = 'PUBLISHED'
    `
  ]);

  return {
    items: transformedItems,
    total,
    facets: {
      categories: categories.map(c => ({
        category: c.category as Category,
        count: c._count.category
      })),
      kinds: kinds.map(k => ({
        kind: k.kind,
        count: k._count.kind
      })),
      priceRange: priceRange[0] || { min: 0, max: 0 }
    }
  };
}

export async function getArtworkBySlug(slug: string): Promise<any> {
  return await prisma.artwork.findFirst({
    where: {
      slug,
      publishedAt: { not: null },
      status: "PUBLISHED"
    },
    include: {
      artist: true,
      images: {
        orderBy: [
          { position: "asc" },
          { createdAt: "asc" }
        ]
      },
      editions: {
        orderBy: { unitAmount: "asc" }
      }
    }
  });
}

export async function getRelatedArtworks(
  artworkId: string,
  artistId: string,
  category: string,
  limit = 6
): Promise<any[]> {
  return await prisma.artwork.findMany({
    where: {
      id: { not: artworkId },
      publishedAt: { not: null },
      status: "PUBLISHED",
      OR: [
        { category },
        { artistId }
      ]
    },
    select: {
      id: true,
      slug: true,
      title: true,
      kind: true,
      priceAmount: true,
      images: {
        where: { position: 0 },
        select: { url: true },
        take: 1
      },
      artist: {
        select: {
          displayName: true,
          slug: true
        }
      },
      editions: {
        where: { type: { in: ["PRINT", "DIGITAL"] } },
        select: { unitAmount: true },
        orderBy: { unitAmount: "asc" },
        take: 1
      }
    },
    orderBy: { publishedAt: "desc" },
    take: limit
  });
}
