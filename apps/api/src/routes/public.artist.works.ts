import { FastifyInstance } from "fastify";
import { prisma } from "@artfromromania/db";

export default async function routes(app: FastifyInstance) {
  app.get("/public/artist/:id/works", async (req, res) => {
    const { id } = req.params as any;
    const rows = await prisma.artwork.findMany({
      where: { artistId: id, published: true },
      orderBy: [{ updatedAt: "desc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        priceMinor: true,
        saleMinor: true,
        onSale: true,
        originalSold: true,
        editions: { select: { id: true, active: true }, where: {} }
      }
    });
    const items = rows.map(r => ({
      ...r,
      soldOut: r.originalSold || !(r.editions || []).some((e: any) => e.active)
    }));
    res.send(items);
  });
}
