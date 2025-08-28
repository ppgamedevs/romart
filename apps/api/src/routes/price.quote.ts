import { FastifyInstance } from "fastify";
import { getQuote } from "@artfromromania/pricing";

export default async function routes(app: FastifyInstance) {
  app.get("/public/price/quote", async (req, res) => {
    const q = req.query as any;
    const input = {
      artworkId: String(q.artworkId),
      editionId: q.editionId ? String(q.editionId) : undefined,
      qty: q.qty ? parseFloat(String(q.qty)) : 1,
      shipToCountry: q.country || "RO",
      currency: q.currency
    };
    try {
      const out = await getQuote(input);
      res.send(out);
    } catch (e: any) {
      res.code(400).send({ error: e.message || "quote-failed" });
    }
  });
}
