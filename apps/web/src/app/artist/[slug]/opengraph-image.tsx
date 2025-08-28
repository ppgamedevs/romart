import { ImageResponse } from "next/og";
import { OG_SIZE, colors, gradientOverlay, contentType } from "@/app/_og/theme";

export const runtime = "edge";
export const size = OG_SIZE;
export const contentType_ = contentType;

// async function loadFont() {
//   const url = new URL("../../_og/Inter-SemiBold.ttf", import.meta.url);
//   const res = await fetch(url);
//   return await res.arrayBuffer();
// }

async function fetchArtist(slug: string) {
  const api = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const r = await fetch(`${api}/public/artist/by-slug/${slug}`, { cache: "no-store" });
  if (!r.ok) return null;
  return r.json() as Promise<{ displayName: string; bio?: string; avatarUrl?: string }>;
}

export default async function Image({ params }: { params: { slug: string } }) {
  // const fontData = await loadFont();
  const a = await fetchArtist(params.slug);

  const name = a?.displayName || "Artist";
  const bio = a?.bio?.slice(0, 140) || "Romanian Artist";
  const avatar = a?.avatarUrl;

  return new ImageResponse(
    (
      <div style={{ width: OG_SIZE.width, height: OG_SIZE.height, display: "flex", background: colors.bg, color: colors.fg, fontFamily: "Inter", position: "relative" }}>
        {/* left column: avatar */}
        <div style={{ flex: "0 0 360px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 260, height: 260, borderRadius: "50%", overflow: "hidden", border: `4px solid ${colors.border}`, background: "#222" }}>
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" width={260} height={260} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 96 }}>🎨</div>
            )}
          </div>
        </div>

        {/* right column */}
        <div style={{ flex: 1, padding: 48, display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}>
          <div style={{ fontSize: 24, opacity: 0.8 }}>Romanian Artist</div>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05 }}>{name}</div>
          <div style={{ fontSize: 26, opacity: 0.85, maxWidth: 700 }}>{bio}</div>
          <div style={{ marginTop: 8, fontSize: 20, opacity: 0.8 }}>artfromromania.com</div>
        </div>

        {/* subtle glow */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(400px 200px at 0% 100%, rgba(255,255,255,0.10), transparent 60%)" }} />
      </div>
    ),
    { ...OG_SIZE }
  );
}
