import { FastifyInstance } from "fastify";
import { prisma } from "@artfromromania/db";

function requireRole(req: any, roles: string[]) { 
  const r = req.user?.role; 
  if (!r || !roles.includes(r)) throw new Error("forbidden"); 
}

export default async function routes(app: FastifyInstance) {
  // curator heartbeat (online)
  app.post("/curation/me/heartbeat", async (req, res) => {
    requireRole(req, ["CURATOR", "ADMIN"]);
    const userId = req.user!.id;
    const profile = await prisma.curatorProfile.findUnique({ where: { userId } });
    if (!profile) return res.code(404).send({ error: "no-profile" });
    
    await prisma.curatorProfile.update({ 
      where: { id: profile.id }, 
      data: { onlineAt: new Date() }
    });
    
    res.send({ ok: true });
  });

  // queue: unassigned & unlocked tickets
  app.get("/curation/queue", async (req, res) => {
    requireRole(req, ["CURATOR", "ADMIN"]);
    const now = new Date();
    const items = await prisma.ticket.findMany({
      where: {
        curatorId: null,
        OR: [
          { claimLockedUntil: null },
          { claimLockedUntil: { lt: now } } // lock expirat
        ],
        status: { in: ["OPEN", "ASSIGNED", "WAITING_CUSTOMER", "WAITING_ARTIST"] }
      },
      orderBy: { lastActivity: "desc" },
      take: 50,
      select: { 
        id: true, 
        subject: true, 
        type: true, 
        artistId: true, 
        artworkId: true, 
        curatorLockedToId: true, 
        claimLockedUntil: true, 
        createdAt: true, 
        payload: true 
      }
    });
    
    res.send({ items });
  });

  // claim: primul care reușește câștigă (optimistic)
  app.post("/curation/ticket/:id/claim", async (req, res) => {
    requireRole(req, ["CURATOR", "ADMIN"]);
    const userId = req.user!.id;
    const curator = await prisma.curatorProfile.findUnique({ where: { userId } });
    if (!curator) return res.code(403).send({ error: "not-curator" });

    // limită active claims
    const active = await prisma.ticket.count({ 
      where: { 
        curatorId: curator.id, 
        status: { in: ["OPEN", "ASSIGNED", "WAITING_CUSTOMER", "WAITING_ARTIST"] } 
      }
    });
    const maxActive = parseInt(process.env.CURATOR_MAX_ACTIVE_CLAIMS || "5", 10);
    if (active >= maxActive) return res.code(409).send({ error: "limit-reached" });

    const id = (req.params as any).id;
    // încercare atomică de claim
    const t = await prisma.ticket.findUnique({ 
      where: { id }, 
      select: { curatorId: true, curatorLockedToId: true, claimLockedUntil: true } 
    });
    
    if (!t) return res.code(404).send({ error: "not-found" });
    const now = new Date();
    if (t.curatorId) return res.code(409).send({ error: "already-claimed" });
    if (t.curatorLockedToId && t.claimLockedUntil && t.claimLockedUntil > now && t.curatorLockedToId !== curator.id) {
      return res.code(423).send({ error: "locked-to-another-curator" });
    }

    try {
      await prisma.ticket.update({
        where: { id, curatorId: null },
        data: { curatorId: curator.id, status: "ASSIGNED", lastActivity: now }
      });
    } catch (error) {
      return res.code(409).send({ error: "race-lost" });
    }

    res.send({ ok: true });
  });

  // release: manual (în caz de greșeală)
  app.post("/curation/ticket/:id/release", async (req, res) => {
    requireRole(req, ["CURATOR", "ADMIN"]);
    const id = (req.params as any).id;
    await prisma.ticket.update({ 
      where: { id }, 
      data: { curatorId: null, status: "OPEN" }
    });
    res.send({ ok: true });
  });
}
