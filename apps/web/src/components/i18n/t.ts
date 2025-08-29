export const dict = {
  en: {
    heroTitle: "Romanian Art, Curated & Ready to Collect",
    heroSubtitle: "Paintings, drawings, photography and digital art from emerging and established artists.",
    shopNow: "Shop now",
    featuredCollections: "Featured Collections",
    trendingNow: "Trending now",
    newArrivals: "New arrivals",
    underPrice: (p: string) => `Under ${p}`,
    from: "From",
    discoverTitle: "Discover",
    shopByMedium: "Shop by medium",
    list: "List",
    grid: "Grid",
  },
  ro: {
    heroTitle: "Artă din România, curatoriată și gata de colecționat",
    heroSubtitle: "Pictură, desen, fotografie și artă digitală de la artiști consacrați și emergenți.",
    shopNow: "Cumpără acum",
    featuredCollections: "Colecții recomandate",
    trendingNow: "În tendințe",
    newArrivals: "Noutăți",
    underPrice: (p: string) => `Sub ${p}`,
    from: "De la",
    discoverTitle: "Descoperă",
    shopByMedium: "Cumpără după tehnică",
    list: "Listă",
    grid: "Grid",
  }
};

export function t(locale: string) {
  return (k: string, ...a: any[]) => {
    // @ts-ignore
    const v = dict[locale]?.[k];
    return typeof v === "function" ? v(...a) : v ?? k;
  };
}
