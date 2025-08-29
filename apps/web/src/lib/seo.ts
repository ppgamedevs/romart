export function money(minor: number | undefined, currency = "EUR") {
  if (typeof minor !== "number") return undefined;
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(minor / 100);
  } catch {
    return (minor / 100).toFixed(2) + " " + currency;
  }
}

export function ldVisualArtwork(a: {
  url: string;
  name: string;
  description?: string;
  image?: string[];
  medium?: string;
  widthCm?: number;
  heightCm?: number;
  depthCm?: number;
  priceMinor?: number;
  currency?: string;
  available?: boolean;
  artist?: { name?: string; url?: string };
}) {
  const offer = typeof a.priceMinor === "number" && a.currency ? {
    "@type": "Offer",
    priceCurrency: a.currency,
    price: (a.priceMinor / 100).toFixed(2),
    availability: a.available === false ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    url: a.url,
  } : undefined;

  const dims = [];
  if (a.widthCm && a.heightCm) dims.push(`${a.widthCm} x ${a.heightCm} cm`);
  if (a.depthCm) dims.push(`${a.depthCm} cm depth`);

  return {
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    name: a.name,
    url: a.url,
    description: a.description,
    image: a.image,
    artMedium: a.medium,
    width: a.widthCm ? { "@type": "QuantitativeValue", value: a.widthCm, unitText: "CM" } : undefined,
    height: a.heightCm ? { "@type": "QuantitativeValue", value: a.heightCm, unitText: "CM" } : undefined,
    depth: a.depthCm ? { "@type": "QuantitativeValue", value: a.depthCm, unitText: "CM" } : undefined,
    creator: a.artist?.name ? { "@type": "Person", name: a.artist.name, url: a.artist.url } : undefined,
    offers: offer
  };
}

export function ldPerson(p: {
  url: string;
  name: string;
  description?: string;
  image?: string;
  sameAs?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: p.name,
    url: p.url,
    description: p.description,
    image: p.image,
    sameAs: p.sameAs,
  };
}

export function ldProfilePage(url: string, about: any) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url,
    about
  };
}

export function canonical(base: string, path: string) {
  try {
    const u = new URL(path, base);
    return u.toString();
  } catch {
    return base + path;
  }
}

export function altLanguages(path: string) {
  const locales = (process.env.LOCALES || "en,ro").split(",");
  const base = process.env.SITE_URL || "http://localhost:3000";
  const entries: Record<string, string> = {};
  for (const l of locales) {
    entries[l] = `${base}/${l}${path.startsWith("/") ? path : `/${path}`}`;
  }
  return entries;
}

export function canonicalUrl(path: string) {
  const base = process.env.SITE_URL || "http://localhost:3000";
  const def = process.env.DEFAULT_LOCALE || "en";
  // canonical fără prefix de locale (sau cu defaultLocale)
  return `${base}/${def}${path.startsWith("/") ? path : `/${path}`}`;
}
