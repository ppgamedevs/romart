export async function GET(_: Request, { params }: { params: Promise<{ artistId: string }> }) {
  const api = process.env.API_URL || "http://localhost:3001";
  const { artistId } = await params;
  const r = await fetch(`${api}/admin/artist-pricing/${artistId}`, { cache: "no-store" });
  return new Response(await r.text(), {
    status: r.status,
    headers: { "content-type": "application/json" }
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ artistId: string }> }) {
  const api = process.env.API_URL || "http://localhost:3001";
  const body = await req.text();
  const { artistId } = await params;
  const r = await fetch(`${api}/admin/artist-pricing/${artistId}/upsert`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body
  });
  return new Response(await r.text(), {
    status: r.status,
    headers: { "content-type": "application/json" }
  });
}
