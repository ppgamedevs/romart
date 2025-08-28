import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 } as const;
export const contentType = "image/png";

async function fetchArtwork(slug: string) {
  const api = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const r = await fetch(`${api}/public/artwork/by-slug/${slug}`, { cache: "no-store" });
  if (!r.ok) return null;
  return r.json();
}

async function fetchQuote(artworkId: string) {
  const api = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const r = await fetch(`${api}/public/price/quote?artworkId=${artworkId}`, { cache: "no-store" });
  if (!r.ok) return null; 
  return r.json();
}

export default async function Image({ params }: { params: { slug: string } }) {
  const art = await fetchArtwork(params.slug);
  const q = art ? await fetchQuote(art.id) : null;
  const pct = q?.unit?.listMinor > 0 ? Math.max(0, Math.round((1 - (q.unit.netMinor / q.unit.listMinor)) * 100)) : 0;
  const showSale = pct >= Math.round(parseFloat(process.env.PROMO_BADGE_MIN_PCT || "0.05") * 100);

  const img = art?.heroImageUrl || art?.images?.[0]?.url; // try heroImageUrl first, then fallback to images array
  return new ImageResponse((
    <div style={{ 
      width: size.width, 
      height: size.height, 
      position: "relative", 
      display: "flex", 
      background: "#0b0b0b", 
      color: "#fff", 
      fontFamily: "Inter" 
    }}>
      {/* imagine */}
      <div style={{ 
        position: "absolute", 
        inset: 0, 
        opacity: img ? 1 : 0.2, 
        background: "#111" 
      }}>
        {img && <img src={img} alt="" width={1200} height={630} style={{ 
          width: "100%", 
          height: "100%", 
          objectFit: "cover" 
        }}/>}
      </div>
      {/* overlay gradient */}
      <div style={{ 
        position: "absolute", 
        inset: 0, 
        background: "linear-gradient(90deg, rgba(0,0,0,0.65), transparent 60%)" 
      }}/>
      <div style={{ 
        position: "relative", 
        zIndex: 2, 
        padding: 48, 
        display: "flex", 
        flexDirection: "column", 
        gap: 12, 
        width: 800 
      }}>
        <div style={{ fontSize: 28, opacity: 0.85 }}>Art from Romania</div>
        <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.05 }}>{art?.title || "Artwork"}</div>
        {showSale && (
          <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
            <div style={{ 
              padding: "10px 18px", 
              borderRadius: 999, 
              background: "#dc2626", 
              color: "#fff", 
              fontSize: 28, 
              fontWeight: 700 
            }}>
              SALE -{pct}%
            </div>
          </div>
        )}
      </div>
    </div>
  ), size);
}
