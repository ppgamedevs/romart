import { ImageResponse } from "next/og";

export const runtime = "edge";
const OG = { width: 1200, height: 630 } as const;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "Discover Art";
  
  return new ImageResponse(
    <div style={{
      width: OG.width,
      height: OG.height,
      display: "flex",
      background: "#0b0b0b",
      color: "#fff",
      fontFamily: "Inter",
      alignItems: "center",
      padding: 48
    }}>
      <div style={{ fontSize: 28, opacity: 0.85 }}>Art from Romania</div>
      <div style={{ fontSize: 72, fontWeight: 700, marginLeft: 24 }}>{q}</div>
    </div>,
    OG
  );
}
