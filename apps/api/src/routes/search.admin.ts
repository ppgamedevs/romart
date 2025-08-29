import { FastifyInstance } from "fastify";
import { prisma } from "@artfromromania/db";
import { z } from "zod";
import { recomputeBoostsForAll, recomputeBoostsForArtwork } from "@artfromromania/db/src/services/search.sync";

function requireAdmin(req: any) { if (req.user?.role !== "ADMIN") throw new Error("forbidden"); }

export default async function routes(app: FastifyInstance) {
  // SYNONYMS
  app.get("/admin/search/synonyms", async (req, res) => {
    requireAdmin(req);
    const items = await prisma.searchSynonym.findMany({ orderBy: [{ canonical: "asc" }] });
    res.send({ items });
  });

  app.post("/admin/search/synonyms/upsert", async (req, res) => {
    requireAdmin(req);
    const S = z.object({ 
      canonical: z.string().min(2), 
      variants: z.array(z.string()).default([]), 
      active: z.boolean().default(true) 
    });
    const d = S.parse(req.body || {});
    const row = await prisma.searchSynonym.upsert({
      where: { canonical: d.canonical.toLowerCase() },
      create: { 
        canonical: d.canonical.toLowerCase(), 
        variants: d.variants.map(v => v.toLowerCase()), 
        active: d.active 
      },
      update: { 
        variants: d.variants.map(v => v.toLowerCase()), 
        active: d.active 
      }
    });
    res.send({ ok: true, row });
  });

  app.post("/admin/search/synonyms/:canonical/delete", async (req, res) => {
    requireAdmin(req);
    await prisma.searchSynonym.delete({ 
      where: { canonical: String((req.params as any).canonical).toLowerCase() } 
    });
    res.send({ ok: true });
  });

  // BOOST RULES
  app.get("/admin/search/boosts", async (req, res) => {
    requireAdmin(req);
    const items = await prisma.searchBoostRule.findMany({ orderBy: [{ updatedAt: "desc" }] });
    res.send({ items });
  });

  app.post("/admin/search/boosts/upsert", async (req, res) => {
    requireAdmin(req);
    const S = z.object({
      id: z.string().optional(),
      scope: z.enum(["GLOBAL", "MEDIUM", "ARTIST", "ARTWORK", "TAG"]),
      medium: z.enum(["PAINTING", "DRAWING", "PHOTOGRAPHY", "DIGITAL"]).nullable().optional(),
      artistId: z.string().nullable().optional(),
      artworkId: z.string().nullable().optional(),
      tag: z.string().nullable().optional(),
      weight: z.number(),
      startsAt: z.string().nullable().optional(),
      endsAt: z.string().nullable().optional(),
      active: z.boolean().default(true)
    });
    const d = S.parse(req.body || {});
    const row = d.id
      ? await prisma.searchBoostRule.update({ 
          where: { id: d.id }, 
          data: { 
            ...d, 
            startsAt: d.startsAt ? new Date(d.startsAt) : null, 
            endsAt: d.endsAt ? new Date(d.endsAt) : null 
          } 
        })
      : await prisma.searchBoostRule.create({ 
          data: { 
            ...d, 
            startsAt: d.startsAt ? new Date(d.startsAt) : null, 
            endsAt: d.endsAt ? new Date(d.endsAt) : null 
          } 
        });
    
    // Recompute boosts pre-calculated
    if (d.scope === "ARTWORK" && d.artworkId) await recomputeBoostsForArtwork(d.artworkId);
    else await recomputeBoostsForAll();
    
    res.send({ ok: true, row });
  });
}
