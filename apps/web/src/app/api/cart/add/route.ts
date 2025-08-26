export async function POST(req: Request) {
  const api = process.env.API_URL || "http://localhost:3001";
  const body = await req.text();
  const r = await fetch(`${api}/cart/add`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    // forward cookies/auth dacă e cazul
  });
  return new Response(await r.text(), { status: r.status, headers: { "content-type": "application/json" } });
}
