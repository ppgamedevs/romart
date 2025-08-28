"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function ArtistInsightsPage() {
  const [d, setD] = useState<any>(null);
  
  useEffect(() => { 
    fetch("/api/studio/insights")
      .then(r => r.json())
      .then(setD)
      .catch(() => {}); 
  }, []);
  
  if (!d) return <div className="p-6">Loading…</div>;

  const funnel = [
    { step: "Views", value: d.funnel.views },
    { step: "Saves", value: d.funnel.saves },
    { step: "Add to cart", value: d.funnel.addToCart },
    { step: "Checkout", value: d.funnel.checkout },
    { step: "Purchases", value: d.funnel.purchases },
  ];
  const lag = Object.entries(d.lagBuckets).map(([k, v]: any) => ({ bucket: k, value: v }));
  const channels = d.channels.map((c: any) => ({ name: c.source, value: c.count }));

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Insights (last {d.windowDays} days)</h1>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border p-4">
          <div className="mb-2 font-medium">Conversion Funnel</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={funnel}>
              <XAxis dataKey="step" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border p-4">
          <div className="mb-2 font-medium">Save → Purchase Lag</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={lag}>
              <XAxis dataKey="bucket" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border p-4">
          <div className="mb-2 font-medium">Channels (utm_source)</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={channels} dataKey="value" nameKey="name" label>
                {channels.map((_: any, i: number) => <Cell key={i} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border p-4">
          <div className="mb-2 font-medium">Top Artworks</div>
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left">Artwork</th>
                <th>Purchases</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {d.topArtworks.map((t: any) => (
                <tr key={t.artworkId}>
                  <td className="py-1">{t.artworkId}</td>
                  <td className="text-center">{t.count}</td>
                  <td className="text-right">{(t.revenueMinor / 100).toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
