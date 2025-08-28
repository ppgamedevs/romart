import "server-only";
export const revalidate = 300;
export const dynamic = 'force-dynamic'

function eur(n:number){ return (n/100).toFixed(2)+" €"; }

async function getData() {
  const r = await fetch(process.env.API_URL + "/admin/analytics/overview", {
    cache: "no-store",
    headers: { Authorization: `Bearer ${process.env.ADMIN_TOKEN}` }
  });
  if (!r.ok) throw new Error("Failed");
  return r.json();
}

export default async function AnalyticsOverview() {
  const d = await getData();
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Analytics Overview (30d)</h1>
      <p className="text-sm opacity-70">Since {new Date(d.since).toISOString().slice(0,10)}</p>
      <div className="grid md:grid-cols-3 gap-4">
        <Card title="Orders (30d)" value={d.orders30d} />
        <Card title="Revenue (30d)" value={eur(d.revenue30dMinor)} />
        <Card title="Affiliate commissions (sum)" value={eur(d.affCommissionMinor)} />
      </div>
    </div>
  );
}

function Card({title, value}:{title:string;value:any}) {
  return <div className="rounded-2xl border p-4"><div className="text-sm opacity-60">{title}</div><div className="text-2xl font-semibold">{value}</div></div>;
}
