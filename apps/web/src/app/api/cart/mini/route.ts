export async function GET() {
  const api = process.env.API_URL || "http://localhost:3001";
  const r = await fetch(`${api}/cart/mini`, { headers: { /* forward cookie dacă ai middleware */ } });
  const text = await r.text();
  return new Response(text, { status: r.status, headers: { "content-type": "application/json" } });
}
