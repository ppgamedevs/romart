export async function GET() {
  const api = process.env.API_URL || "http://localhost:3001";
  const r = await fetch(`${api}/admin/print-costs`, { cache: "no-store" });
  return new Response(await r.text(), {
    status: r.status,
    headers: { "content-type": "application/json" }
  });
}

export async function POST(req: Request) {
  const api = process.env.API_URL || "http://localhost:3001";
  const body = await req.text();
  const r = await fetch(`${api}/admin/print-costs/upsert`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body
  });
  return new Response(await r.text(), {
    status: r.status,
    headers: { "content-type": "application/json" }
  });
}
