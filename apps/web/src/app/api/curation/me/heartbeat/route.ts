export async function POST() {
  const api = process.env.API_URL || "http://localhost:3001";
  const r = await fetch(`${api}/curation/me/heartbeat`, {
    method: "POST"
  });
  return new Response(await r.text(), {
    status: r.status, 
    headers: { "content-type": "application/json" }
  });
}
