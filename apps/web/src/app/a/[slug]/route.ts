import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }>}) {
  const { slug } = await params;
  const r = await fetch(`${process.env.API_URL}/artist-share/resolve?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
  if (!r.ok) return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_SITE_URL));
  const data = await r.json();

  // construim URL final cu utm + asl (pentru front-end)
  const dest = new URL(data.landing, process.env.NEXT_PUBLIC_SITE_URL);
  dest.searchParams.set("asl", data.asl);
  Object.entries(data.utm || {}).forEach(([k,v]) => dest.searchParams.set(k, String(v)));

  return NextResponse.redirect(dest);
}
