export async function POST(_: Request, { params }: { params: { id: string } }) {
  const api = process.env.API_URL || "http://localhost:3001";
  const r = await fetch(`${api}/admin/print-costs/${params.id}/delete`, { method: "POST" });
  return new Response(await r.text(), {
    status: r.status,
    headers: { "content-type": "application/json" }
  });
}
