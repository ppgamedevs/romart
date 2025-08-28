import { FastifyInstance } from "fastify";
import { prisma } from "@artfromromania/db";
import { z } from "zod";

function requireAdmin(req: any) { 
  if (req.user?.role !== "ADMIN") throw new Error("forbidden"); 
}

export default async function routes(app: FastifyInstance) {
  app.get("/admin/collections", async (req, res) => {
    requireAdmin(req);
    const items = await prisma.curatedCollection.findMany({ 
      orderBy: [{ updatedAt: "desc" }] 
    });
    res.send({ items });
  });

  app.post("/admin/collections/upsert", async (req, res) => {
    requireAdmin(req);
    const S = z.object({
      id: z.string().optional(),
      slug: z.string(),
      title: z.string(),
      subtitle: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
      coverImageUrl: z.string().url().nullable().optional(),
      heroTone: z.enum(["DARK", "LIGHT"]).default("DARK"),
      curatorId: z.string().nullable().optional(),
      isFeatured: z.boolean().default(false),
      sortIndex: z.number().int().default(0),
      publishedAt: z.string().nullable().optional(),
      items: z.array(z.object({ 
        artworkId: z.string(), 
        sortIndex: z.number().int().default(0) 
      })).default([])
    });
    const d = S.parse(req.body || {});
    const data: any = { 
      ...d, 
      publishedAt: d.publishedAt ? new Date(d.publishedAt) : null 
    };
    
    const row = d.id
      ? await prisma.curatedCollection.update({
          where: { id: d.id },
          data: {
            ...data,
            items: { 
              deleteMany: {}, 
              create: d.items.map(x => ({ 
                artworkId: x.artworkId, 
                sortIndex: x.sortIndex 
              })) 
            }
          }
        })
      : await prisma.curatedCollection.create({
          data: {
            ...data,
            items: { 
              create: d.items.map(x => ({ 
                artworkId: x.artworkId, 
                sortIndex: x.sortIndex 
              })) 
            }
          }
        });
    res.send({ ok: true, row });
  });
}
