export async function POST(_: Request, { params }: { params: Promise<{ batchId: string }> }) {
  const api = process.env.API_URL || "http://localhost:3001";
  const { batchId } = await params;
  const r = await fetch(`${api}/admin/curators/payouts/${batchId}/process`, {
    method: "POST"
  });
  return new Response(await r.text(), {
    status: r.status, 
    headers: { "content-type": "application/json" }
  });
}
