import { app } from "../../index";

type Art = { 
  id: string; 
  artistId: string; 
  priceMinor: number; 
  medium: string; 
  styleTags: string[]; 
  colors: string[] 
};

const W = { 
  medium: 2.0, 
  style: 1.5, 
  colors: 1.0, 
  price: 1.0, 
  pop: 2.0 
};

export function jaccard(a: string[], b: string[]) {
  if (!a?.length || !b?.length) return 0;
  const A = new Set(a), B = new Set(b);
  let inter = 0;
  for (const v of A) if (B.has(v)) inter++;
  return inter / (A.size + B.size - inter);
}

export function priceAffinity(a: number, b: number, tol = 0.35) {
  const lo = a * (1 - tol), hi = a * (1 + tol);
  if (b < lo || b > hi) return 0;
  const mid = (lo + hi) / 2, d = Math.abs(b - mid) / (hi - lo);
  return 1 - d * 2; // 1 la centru → 0 la margini
}

// scor content-based + popularitate (fallback dacă nu ai SimilarArtwork precomputat)
export function scoreSimilar(src: Art, cand: Art, pop: number) {
  const sMedium = src.medium && cand.medium && src.medium === cand.medium ? 1 : 0;
  const sStyle = jaccard(src.styleTags || [], cand.styleTags || []);
  const sColor = jaccard(src.colors || [], cand.colors || []);
  const sPrice = priceAffinity(src.priceMinor, cand.priceMinor);
  
  return W.medium * sMedium + W.style * sStyle + W.colors * sColor + W.price * sPrice + W.pop * pop;
}

// trending score agregat (pe fereastră RECS_TRENDING_WINDOW_DAYS)
export function trendingFormula({ 
  views, 
  favs, 
  carts, 
  buys 
}: { 
  views: number; 
  favs: number; 
  carts: number; 
  buys: number 
}) {
  return views * 0.1 + favs * 0.5 + carts * 1.0 + buys * 2.0;
}
