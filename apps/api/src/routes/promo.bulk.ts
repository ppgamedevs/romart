import { FastifyInstance } from "fastify";
import { getQuote } from "@artfromromania/pricing";

export default async function routes(app: FastifyInstance) {
  app.post("/public/promo/bulk", async (req, res) => {
    const body = (req.body as any) || {};
    const ids: string[] = Array.isArray(body.artworkIds) ? body.artworkIds.slice(0, 50) : [];
    const country = body.country || "RO";
    const out: any = {};
    for (const id of ids) {
      try {
        const q = await getQuote({ artworkId: id, shipToCountry: country });
        const pct = q.unit.listMinor > 0 ? 1 - (q.unit.netMinor / q.unit.listMinor) : 0;
        out[id] = {
          sale: pct >= (parseFloat(process.env.PROMO_BADGE_MIN_PCT || "0.05")),
          pct: Math.max(0, Math.round(pct * 100))
        };
      } catch { 
        out[id] = { sale: false, pct: 0 }; 
      }
    }
    res.send({ items: out });
  });
}
