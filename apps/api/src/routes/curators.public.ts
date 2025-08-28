import { FastifyInstance } from "fastify";
import { prisma } from "@artfromromania/db";

export default async function routes(app: FastifyInstance) {
  app.get("/public/curators", async (req, res) => {
    const pageSize = parseInt(process.env.CURATOR_PUBLIC_PAGE_SIZE || "24", 10);
    const curators = await prisma.curatorProfile.findMany({
      where: { isPublic: true },
      select: {
        slug: true, 
        displayName: true, 
        avatarUrl: true, 
        tagline: true,
        languages: true, 
        specialties: true, 
        featured: true, 
        sortIndex: true, 
        onlineAt: true
      },
      orderBy: [{ featured: "desc" }, { sortIndex: "asc" }, { updatedAt: "desc" }],
      take: pageSize
    });
    
    const onlineWindow = parseInt(process.env.CURATOR_HEARTBEAT_WINDOW_SEC || "180", 10) * 1000;
    const now = Date.now();
    const items = curators.map(c => ({ 
      ...c, 
      online: c.onlineAt ? (now - new Date(c.onlineAt).getTime() < onlineWindow) : false 
    }));
    
    res.send({ items });
  });

  app.get("/public/curator/:slug", async (req, res) => {
    const { slug } = req.params as any;
    const c = await prisma.curatorProfile.findUnique({
      where: { slug },
      select: {
        slug: true, 
        displayName: true, 
        avatarUrl: true, 
        tagline: true, 
        bio: true,
        languages: true, 
        specialties: true, 
        socials: true, 
        onlineAt: true, 
        featured: true
      }
    });
    
    if (!c) return res.code(404).send({ error: "not-found" });
    
    const onlineWindow = parseInt(process.env.CURATOR_HEARTBEAT_WINDOW_SEC || "180", 10) * 1000;
    const online = c.onlineAt ? (Date.now() - new Date(c.onlineAt).getTime() < onlineWindow) : false;
    
    res.send({ ...c, online });
  });
}
