import { FastifyInstance } from "fastify";
import { prisma } from "@artfromromania/db";

export default async function routes(app: FastifyInstance) {
  app.get("/public/artwork/:id/images", async (req, res) => {
    const { id } = req.params as any;
    const rows = await prisma.image.findMany({ 
      where: { artworkId: id }, 
      orderBy: [{ position: "asc" }, { createdAt: "asc" }] 
    });
    res.send(rows.map(r => ({ id: r.id, url: r.url })));
  });
}
