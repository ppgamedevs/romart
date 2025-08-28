import { FastifyInstance } from "fastify";
import { prisma } from "@artfromromania/db";
import { z } from "zod";

function requireAdmin(req: any) { if (req.user?.role !== "ADMIN") throw new Error("forbidden"); }

export default async function routes(app: FastifyInstance) {
  // List + facets
  app.get("/admin/print-costs", async (req, res) => {
    requireAdmin(req);
    const items = await prisma.printBaseCost.findMany({ orderBy: [{ kind: "asc" }, { sizeLabel: "asc" }] });
    res.send({ items });
  });

  // Upsert
  app.post("/admin/print-costs/upsert", async (req, res) => {
    requireAdmin(req);
    const S = z.object({ 
      kind: z.string(), 
      sizeLabel: z.string(), 
      baseMinor: z.number().int().min(0), 
      packagingMinor: z.number().int().min(0).default(0), 
      leadDays: z.number().int().min(0).default(5), 
      active: z.boolean().default(true) 
    });
    const d = S.parse(req.body || {});
    const row = await prisma.printBaseCost.upsert({
      where: { kind_sizeLabel: { kind: d.kind, sizeLabel: d.sizeLabel } },
      create: d, 
      update: d
    });
    res.send({ ok: true, row });
  });

  app.post("/admin/print-costs/:id/delete", async (req, res) => {
    requireAdmin(req);
    await prisma.printBaseCost.delete({ where: { id: (req.params as any).id } });
    res.send({ ok: true });
  });

  // Artist pricing profile
  app.get("/admin/artist-pricing/:artistId", async (req, res) => {
    requireAdmin(req);
    const { artistId } = req.params as any;
    const p = await prisma.artistPricingProfile.findUnique({ where: { artistId } });
    res.send(p || {});
  });

  app.post("/admin/artist-pricing/:artistId/upsert", async (req, res) => {
    requireAdmin(req);
    const { artistId } = req.params as any;
    const S = z.object({
      printMarkupPct: z.number().nullable().optional(),
      canvasMarkupPct: z.number().nullable().optional(),
      metalMarkupPct: z.number().nullable().optional(),
      photoMarkupPct: z.number().nullable().optional(),
      minMarginPct: z.number().nullable().optional(),
      rounding: z.enum(["NONE", "END_00", "END_90", "END_99"]).optional(),
      active: z.boolean().optional()
    });
    const d = S.parse(req.body || {});
    const row = await prisma.artistPricingProfile.upsert({
      where: { artistId },
      create: { artistId, ...d },
      update: d
    });
    res.send({ ok: true, row });
  });

  // Preview pricing pentru un edition fără preț
  app.get("/admin/pricing/preview", async (req, res) => {
    requireAdmin(req);
    const q = req.query as any;
    // re-folosim /public/price/quote (Prompt 36), dar nu cere currency/country
    res.redirect(307, `/public/price/quote?artworkId=${encodeURIComponent(q.artworkId)}&editionId=${encodeURIComponent(q.editionId || "")}`);
  });
}
