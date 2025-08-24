export const CATEGORIES = ["Painting", "Drawing", "Photography", "Digital"] as const;
export const SORT_OPTIONS = ["newest", "price_asc", "price_desc"] as const;

export type Category = (typeof CATEGORIES)[number];
export type SortOption = (typeof SORT_OPTIONS)[number];

export const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest",
  price_asc: "Price: Low to High", 
  price_desc: "Price: High to Low"
};
