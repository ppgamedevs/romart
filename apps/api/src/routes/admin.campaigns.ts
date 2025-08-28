import { FastifyInstance } from "fastify";
import { prisma } from "@artfromromania/db";
import { z } from "zod";

function requireAdmin(req: any) { if (req.user?.role !== "ADMIN") throw new Error("forbidden"); }

export default async function routes(app: FastifyInstance) {
  app.get("/admin/campaigns", async (req, res) => {
    requireAdmin(req);
    const items = await prisma.campaign.findMany({ orderBy: [{ startsAt: "desc" }] });
    res.send({ items });
  });

  app.post("/admin/campaigns/upsert", async (req, res) => {
    requireAdmin(req);
    const S = z.object({
      id: z.string().optional(),
      name: z.string().min(2),
      scope: z.enum(["GLOBAL", "MEDIUM", "ARTIST", "ARTWORK", "EDITION_KIND"]),
      medium: z.enum(["PAINTING", "DRAWING", "PHOTOGRAPHY", "DIGITAL"]).nullable().optional(),
      artistId: z.string().nullable().optional(),
      artworkId: z.string().nullable().optional(),
      editionKind: z.enum(["ORIGINAL", "CANVAS", "METAL", "PHOTO"]).nullable().optional(),
      pct: z.number().nullable().optional(),
      addMinor: z.number().int().nullable().optional(),
      maxDiscountMinor: z.number().int().nullable().optional(),
      priority: z.number().int().default(50),
      stackable: z.boolean().default(false),
      ogBadge: z.boolean().default(true),
      startsAt: z.string(),
      endsAt: z.string(),
      active: z.boolean().default(true),
    });
    const d = S.parse(req.body || {});
    const data: any = { ...d, startsAt: new Date(d.startsAt), endsAt: new Date(d.endsAt) };
    const row = d.id
      ? await prisma.campaign.update({ where: { id: d.id }, data })
      : await prisma.campaign.create({ data });
    res.send({ ok: true, row });
  });

  app.post("/admin/campaigns/:id/toggle", async (req, res) => {
    requireAdmin(req);
    const id = (req.params as any).id;
    const { active } = (req.body as any) || {};
    await prisma.campaign.update({ where: { id }, data: { active: !!active } });
    res.send({ ok: true });
  });
}
