export async function POST(request: Request, { params }: { params: { exhId: string } }) {
  const api = process.env.API_URL || "http://localhost:3001";
  
  const r = await fetch(`${api}/admin/exhibitions/${params.exhId}/delete`, {
    method: "POST"
  });
  
  return new Response(await r.text(), { status: r.status, headers: { "content-type": "application/json" } });
}
