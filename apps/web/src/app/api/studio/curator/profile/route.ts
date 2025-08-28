export async function GET() {
  const api = process.env.API_URL || "http://localhost:3001";
  const r = await fetch(`${api}/public/me/curator-profile`, {
    cache: "no-store"
  });
  return new Response(await r.text(), {
    status: r.status, 
    headers: { "content-type": "application/json" }
  });
}
