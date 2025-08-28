import { ImageResponse } from "next/og";
import { OG_SIZE, colors, gradientOverlay, contentType } from "./_og/theme";

export const runtime = "edge";
export const alt = "Art from Romania — Discover Romanian Art";
export const size = OG_SIZE;
export const contentType_ = contentType; // just to keep a reference

// async function loadFont() {
//   const url = new URL("./_og/Inter-SemiBold.ttf", import.meta.url);
//   const res = await fetch(url);
//   return await res.arrayBuffer();
// }

export default async function Image() {
  // const fontData = await loadFont();

  return new ImageResponse(
    (
      <div
        style={{
          width: OG_SIZE.width,
          height: OG_SIZE.height,
          display: "flex",
          background: colors.bg,
          color: colors.fg,
          fontFamily: "Inter",
          position: "relative",
        }}
      >
        {/* Background pattern / brand */}
        <div
          style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(1200px 500px at -10% -10%, rgba(255,255,255,0.06) 0%, transparent 50%)"
          }}
        />
        <div style={{ padding: 48, display: "flex", flexDirection: "column", gap: 18, zIndex: 1 }}>
          <div style={{ fontSize: 28, opacity: 0.7 }}>Art from Romania</div>
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.05, maxWidth: 900 }}>
            Discover contemporary Romanian art — curated paintings, drawings, photography & digital art
          </div>
          <div style={{ display: "inline-flex", gap: 12, marginTop: 8 }}>
            {["Paintings", "Drawings", "Photography", "Digital"].map((t) => (
              <div key={t} style={{
                padding: "8px 14px",
                borderRadius: 999,
                background: colors.pill,
                border: `1px solid ${colors.border}`,
                fontSize: 20
              }}>{t}</div>
            ))}
          </div>
          <div style={{ marginTop: "auto", fontSize: 20, opacity: 0.75 }}>
            artfromromania.com
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE }
  );
}
