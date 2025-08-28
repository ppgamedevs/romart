import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 } as const;
export const contentType = "image/png";

async function fetchCollection(slug: string) {
  const r = await fetch(`/api/public/collection/${slug}`, { cache: "no-store" }); 
  if (!r.ok) return null; 
  return r.json();
}

export default async function Image({ params }: { params: { slug: string } }) {
  const c = await fetchCollection(params.slug);
  return new ImageResponse((
    <div style={{ 
      width: size.width, 
      height: size.height, 
      display: "flex", 
      background: "#0b0b0b", 
      color: "#fff", 
      fontFamily: "Inter", 
      position: "relative" 
    }}>
      {c?.coverImageUrl && (
        <img 
          src={c.coverImageUrl} 
          alt="" 
          width={1200} 
          height={630} 
          style={{ 
            position: "absolute", 
            inset: 0, 
            objectFit: "cover", 
            opacity: 0.4 
          }}
        />
      )}
      <div style={{ 
        position: "relative", 
        zIndex: 2, 
        padding: 48, 
        display: "flex", 
        flexDirection: "column", 
        gap: 12 
      }}>
        <div style={{ fontSize: 28, opacity: 0.85 }}>Curated Collection</div>
        <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.05, maxWidth: 900 }}>
          {c?.title || "Collection"}
        </div>
        {c?.subtitle && (
          <div style={{ fontSize: 26, opacity: 0.9, maxWidth: 900 }}>
            {c.subtitle}
          </div>
        )}
      </div>
    </div>
  ), size);
}
