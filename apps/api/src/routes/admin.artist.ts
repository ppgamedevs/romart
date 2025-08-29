import { FastifyInstance } from "fastify";
import { prisma } from "@artfromromania/db";
import { z } from "zod";

function requireAdmin(req: any) {
  if (req.user?.role !== "ADMIN") throw new Error("forbidden");
}

export default async function routes(app: FastifyInstance) {
  app.post("/admin/artist/:id/verify", async (req, res) => {
    requireAdmin(req);
    const { id } = req.params as any;
    const on = Boolean((req.body as any)?.on ?? true);
    const row = await prisma.artist.update({
      where: { id },
      data: { verifiedAt: on ? new Date() : null, verifiedById: on ? req.user?.id : null }
    });
    res.send({ ok: true, artist: row });
  });

  app.get("/admin/artist/:id/exhibitions", async (req, res) => {
    requireAdmin(req);
    const { id } = req.params as any;
    const items = await prisma.exhibition.findMany({
      where: { artistId: id },
      orderBy: [{ highlight: "desc" }, { sortIndex: "asc" }, { startDate: "desc" }]
    });
    res.send({ items });
  });

  app.post("/admin/artist/:id/exhibitions/upsert", async (req, res) => {
    requireAdmin(req);
    const { id } = req.params as any;
    const S = z.object({
      id: z.string().optional(),
      type: z.enum(["SOLO", "GROUP"]),
      title: z.string().min(2),
      venue: z.string().nullable().optional(),
      city: z.string().nullable().optional(),
      country: z.string().nullable().optional(),
      startDate: z.string().nullable().optional(),
      endDate: z.string().nullable().optional(),
      url: z.string().url().nullable().optional(),
      highlight: z.boolean().default(false),
      sortIndex: z.number().int().default(0)
    });
    const d = S.parse(req.body || {});
    const row = d.id
      ? await prisma.exhibition.update({
          where: { id: d.id },
          data: {
            ...d,
            artistId: id,
            startDate: d.startDate ? new Date(d.startDate) : null,
            endDate: d.endDate ? new Date(d.endDate) : null
          }
        })
      : await prisma.exhibition.create({
          data: {
            ...d,
            artistId: id,
            startDate: d.startDate ? new Date(d.startDate) : null,
            endDate: d.endDate ? new Date(d.endDate) : null
          }
        });
    res.send({ ok: true, row });
  });

  app.post("/admin/exhibitions/:exhId/delete", async (req, res) => {
    requireAdmin(req);
    const { exhId } = req.params as any;
    await prisma.exhibition.delete({ where: { id: exhId } });
    res.send({ ok: true });
  });
}
