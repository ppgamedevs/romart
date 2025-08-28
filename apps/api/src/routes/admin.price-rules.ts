import { FastifyInstance } from "fastify";
import { prisma } from "@artfromromania/db";
import { z } from "zod";

export default async function routes(app: FastifyInstance) {
  app.get("/admin/price-rules", async (_req, res) => {
    const items = await prisma.priceRule.findMany({ 
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }] 
    });
    res.send({ items });
  });

  app.post("/admin/price-rules/:id/toggle", async (req, res) => {
    const id = (req.params as any).id;
    const S = z.object({ active: z.boolean() });
    const { active } = S.parse(req.body || {});
    await prisma.priceRule.update({ where: { id }, data: { active } });
    res.send({ ok: true });
  });
}
