export async function POST(req: Request) {
  // Forward către API (sau loghează aici)
  const api = process.env.API_URL || "http://localhost:3001";
  const body = await req.text();
  await fetch(`${api}/metrics/web-vitals`, { 
    method: "POST", 
    body, 
    headers: { "content-type": "application/json" } 
  }).catch(() => {});
  return new Response(null, { status: 204 });
}
