import { ImageResponse } from "next/og";

export const runtime = "edge";

const OG = { width: 1200, height: 630 } as const;

function chip(txt: string) {
  return (
    <div
      style={{
        padding: "8px 14px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.18)",
        fontSize: 24,
      }}
    >
      {txt}
    </div>
  );
}

// Use built-in fonts for simplicity
// async function loadFont() {
//   const url = new URL("../../_og/Inter-SemiBold.ttf", import.meta.url);
//   const res = await fetch(url);
//   return res.arrayBuffer();
// }

function mediumLabel(m?: string) {
  const map: Record<string, string> = {
    painting: "Painting",
    drawing: "Drawing",
    photography: "Photography",
    digital: "Digital Art",
  };
  return m && map[m] ? map[m] : "All Media";
}

function sortLabel(s?: string) {
  switch (s) {
    case "price_asc": return "Price ↑";
    case "price_desc": return "Price ↓";
    default: return "Popular";
  }
}

export async function GET(req: Request) {
  // const fontData = await loadFont();
  const { searchParams } = new URL(req.url);
  const medium = (searchParams.get("medium") || "all").toLowerCase();
  const sort = (searchParams.get("sort") || "popular").toLowerCase();

  // Încearcă să iei un thumbnail ca background din feed-ul /discover
  const api = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:3001";
  let bg: string | null = null;
  try {
    const qs = new URLSearchParams();
    if (medium && medium !== "all") qs.set("medium", medium);
    if (sort) qs.set("sort", sort);
    qs.set("page", "1");
    const r = await fetch(`${api}/discover?${qs.toString()}`, { cache: "no-store" });
    if (r.ok) {
      const json = await r.json();
      const first = json?.items?.[0];
      bg = first?.heroUrl || first?.thumbUrl || null;
    }
  } catch {}

  const title = `Discover — ${mediumLabel(medium)}`;
  const sub = `Curated Romanian Art · ${sortLabel(sort)}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: OG.width, height: OG.height, position: "relative",
          display: "flex", background: "#0b0b0b", color: "#fff", fontFamily: "Inter",
        }}
      >
        {bg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bg}
            alt=""
            width={OG.width}
            height={OG.height}
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", filter: "saturate(110%) contrast(108%) brightness(85%)",
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute", inset: 0,
              background:
                "radial-gradient(900px 400px at -10% -10%, rgba(255,255,255,0.06), transparent 60%)",
            }}
          />
        )}

        {/* gradient pentru lizibilitate */}
        <div
          style={{
            position: "absolute", inset: 0,
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.66) 0%, rgba(0,0,0,0.33) 40%, rgba(0,0,0,0.10) 100%)",
          }}
        />

        <div style={{ position: "relative", zIndex: 1, padding: 48, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 28, opacity: 0.75 }}>Art from Romania</div>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.05, maxWidth: 980 }}>{title}</div>
          <div style={{ fontSize: 28, opacity: 0.9 }}>{sub}</div>

          <div style={{ display: "inline-flex", gap: 12, marginTop: 8 }}>
            {chip(mediumLabel(medium))}
            {chip(sortLabel(sort))}
          </div>

          <div style={{ marginTop: "auto", fontSize: 20, opacity: 0.8 }}>artfromromania.com</div>
        </div>
      </div>
    ),
    { ...OG }
  );
}
