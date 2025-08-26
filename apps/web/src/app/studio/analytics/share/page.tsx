import "server-only";
export const revalidate = 0;
const eur = (n:number)=> (n/100).toFixed(2)+" €";

async function getData() {
  const r = await fetch(process.env.API_URL + "/studio/share-links", {
    cache: "no-store",
    headers: { /* forward auth cookie/token dacă aveți middleware */ }
  });
  if (!r.ok) throw new Error("Failed to load");
  return r.json();
}

export default async function ShareAnalytics() {
  const d = await getData();
  const totals = d.links.reduce((t:any, x:any)=>({ visits:t.visits+x.visits, orders:t.orders+x.orders, rev:t.rev+x.revenueMinor }), { visits:0, orders:0, rev:0 });
  const cr = totals.visits ? (totals.orders / totals.visits * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Artist Share Links</h1>
      <div className="grid md:grid-cols-4 gap-4">
        <Card title="Visits" value={totals.visits} />
        <Card title="Orders" value={totals.orders} />
        <Card title="Revenue" value={eur(totals.rev)} />
        <Card title="CR" value={cr.toFixed(2) + "%"} />
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Your Links</h2>
        <div className="overflow-x-auto border rounded-2xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Slug</th>
                <th className="p-2">Landing</th>
                <th className="p-2">Visits</th>
                <th className="p-2">Orders</th>
                <th className="p-2">Revenue</th>
                <th className="p-2">Share</th>
              </tr>
            </thead>
            <tbody>
              {d.links.map((r:any)=>(
                <tr key={r.id} className="border-t">
                  <td className="p-2 font-mono">{r.slug}</td>
                  <td className="p-2">{r.landing}</td>
                  <td className="p-2 text-right">{r.visits}</td>
                  <td className="p-2 text-right">{r.orders}</td>
                  <td className="p-2 text-right">{eur(r.revenueMinor)}</td>
                  <td className="p-2">
                    <Share slug={r.slug} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <CreateLinkForm />
    </div>
  );
}

function Card({title, value}:{title:string; value:any}) {
  return <div className="rounded-2xl border p-4"><div className="text-sm opacity-60">{title}</div><div className="text-2xl font-semibold">{value}</div></div>
}

function Share({ slug }:{ slug:string }) {
  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/a/${slug}`;
  return (
    <button className="text-blue-600 hover:underline" onClick={async()=>{ await navigator.clipboard.writeText(url); alert("Link copied"); }}>
      Copy
    </button>
  );
}

// simplu — SSR page, dar formularul poate fi client component
function CreateLinkForm() {
  return (
    <form action="/studio/share-links/new" method="post" className="flex gap-2 items-center">
      <input name="landing" placeholder="/artist/your-slug" className="border rounded px-3 py-2 text-sm w-72" />
      <button className="border rounded px-3 py-2 text-sm">Create</button>
    </form>
  );
}
