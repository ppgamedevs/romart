export async function GET(request: Request, { params }: { params: { id: string } }) {
  const api = process.env.API_URL || "http://localhost:3001";
  const r = await fetch(`${api}/admin/artist/${params.id}/exhibitions`);
  return new Response(await r.text(), { status: r.status, headers: { "content-type": "application/json" } });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const api = process.env.API_URL || "http://localhost:3001";
  const body = await request.json();
  
  const r = await fetch(`${api}/admin/artist/${params.id}/exhibitions/upsert`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  
  return new Response(await r.text(), { status: r.status, headers: { "content-type": "application/json" } });
}
