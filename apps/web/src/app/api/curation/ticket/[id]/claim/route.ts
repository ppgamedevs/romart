export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const api = process.env.API_URL || "http://localhost:3001";
  const { id } = await params;
  const r = await fetch(`${api}/curation/ticket/${id}/claim`, {
    method: "POST"
  });
  return new Response(await r.text(), {
    status: r.status, 
    headers: { "content-type": "application/json" }
  });
}
