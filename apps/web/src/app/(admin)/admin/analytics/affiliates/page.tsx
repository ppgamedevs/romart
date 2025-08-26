import "server-only";
export const revalidate = 300;
const eur = (n:number)=> (n/100).toFixed(2)+" €";

async function getData() {
  const r = await fetch(process.env.API_URL + "/admin/analytics/affiliates", {
    cache: "no-store",
    headers: { Authorization: `Bearer ${process.env.ADMIN_TOKEN}` }
  });
  if (!r.ok) throw new Error("Failed");
  return r.json();
}

export default async function Affiliates() {
  const d = await getData();

  const rowsPartner = d.byPartner.map((x:any)=>({
    key: x.partnerId || "—", status: x.status, currency: x.currency,
    count: x._count?._all ?? 0, subtotal: x._sum?.subtotalMinor ?? 0, commission: x._sum?.commissionMinor ?? 0
  }));
  const rowsLink = d.byLink.map((x:any)=>({
    key: x.linkId || "—", status: x.status, currency: x.currency,
    count: x._count?._all ?? 0, subtotal: x._sum?.subtotalMinor ?? 0, commission: x._sum?.commissionMinor ?? 0
  }));

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Affiliates & Curators — Conversions</h1>
      <p className="text-sm opacity-70">Since {new Date(d.since).toISOString().slice(0,10)}</p>

      <Section title="By Partner" rows={rowsPartner} />
      <Section title="By Link" rows={rowsLink} />
    </div>
  );
}

function Section({title, rows}:{title:string; rows:any[]}) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <div className="overflow-x-auto border rounded-2xl">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Key</th>
              <th className="p-2">Status</th>
              <th className="p-2">Currency</th>
              <th className="p-2">Orders</th>
              <th className="p-2">Subtotal</th>
              <th className="p-2">Commission</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={i} className="border-t">
                <td className="p-2">{r.key}</td>
                <td className="p-2">{r.status}</td>
                <td className="p-2">{r.currency}</td>
                <td className="p-2 text-right">{r.count}</td>
                <td className="p-2 text-right">{eur(r.subtotal)}</td>
                <td className="p-2 text-right">{eur(r.commission)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
