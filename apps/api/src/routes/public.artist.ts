import { FastifyInstance } from "fastify";
import { prisma } from "@artfromromania/db";

function soldOutForArtwork(a: any) {
  // ORIGINAL sold dacă hasOriginal && soldOriginal==true
  const origSold = !!a.originalSold;
  // dacă nu există ediții disponibile (active) => sold out
  const editions = (a.editions || []).filter((e: any) => e.active !== false);
  const allInactive = editions.length === 0;
  return origSold || allInactive;
}

export default async function routes(app: FastifyInstance) {
  // GET by slug cu exhibitions + KPIs
  app.get("/public/artist/by-slug/:slug", async (req, res) => {
    const { slug } = req.params as any;
    const artist = await prisma.artist.findUnique({
      where: { slug },
      include: {
        exhibitions: { 
          orderBy: [
            { highlight: "desc" }, 
            { sortIndex: "asc" }, 
            { startDate: "desc" }
          ] 
        }
      }
    });
    if (!artist) return res.status(404).send({ error: "not_found" });

    // KPIs (rapid, fără N+1)
    const [worksCount, soldCount] = await Promise.all([
      prisma.artwork.count({ where: { artistId: artist.id, published: true } }),
      prisma.artwork.count({
        where: {
          artistId: artist.id,
          published: true,
          OR: [
            { originalSold: true },
            { editions: { none: { active: true } } }
          ]
        }
      })
    ]);

    res.send({ artist, kpi: { worksCount, soldCount } });
  });
}
