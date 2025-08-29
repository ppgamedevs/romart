import { FastifyInstance } from "fastify";

export default async function routes(app: FastifyInstance) {
  app.get("/public/shipping/estimate", async (req, res) => {
    const q = req.query as any;
    const dest = String(q.dest || "RO").toUpperCase();    // ISO-2
    const subtotalMinor = parseInt(String(q.subtotalMinor || "0"), 10); // fără shipping
    const isRO = dest === "RO";
    const freeThresh = isRO
      ? parseInt(process.env.FREE_SHIP_RO_MINOR || "25000", 10)
      : parseInt(process.env.FREE_SHIP_INTL_MINOR || "150000", 10);
    const free = subtotalMinor >= freeThresh;

    const provider = isRO ? "Sameday" : "DHL";
    const minDays = parseInt(isRO ? process.env.SLA_RO_MIN_DAYS || "1" : process.env.SLA_INTL_MIN_DAYS || "3", 10);
    const maxDays = parseInt(isRO ? process.env.SLA_RO_MAX_DAYS || "3" : process.env.SLA_INTL_MAX_DAYS || "7", 10);

    // Heuristic cost (doar estimativ; în checkout se calculează final)
    const baseMinor = isRO ? 2500 : 3500; // 25€ RO, 35€ Intl
    const estMinor = free ? 0 : baseMinor;

    res.send({
      provider, dest, free,
      etaDays: { min: minDays, max: maxDays },
      estimateMinor: estMinor,
      freeThresholdMinor: freeThresh,
      currency: process.env.DEFAULT_CURRENCY || "EUR"
    });
  });
}
