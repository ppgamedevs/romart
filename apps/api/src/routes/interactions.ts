import { FastifyInstance } from "fastify";

export default async function routes(app: FastifyInstance) {
  // Track interaction (view, favorite, add to cart, purchase)
  app.post("/interactions", async (req, res) => {
    const userId = (req as any).user?.id as string | undefined;
    const body = (req.body as any) || {};
    
    const { artworkId, kind, weight = 1 } = body;
    
    if (!artworkId || !kind) {
      return res.code(400).send({ error: "Missing artworkId or kind" });
    }
    
    if (!["VIEW", "FAVORITE", "ADD_TO_CART", "PURCHASE"].includes(kind)) {
      return res.code(400).send({ error: "Invalid interaction kind" });
    }
    
    try {
      // Verify artwork exists and is published
      const artwork = await app.prisma.artwork.findUnique({
        where: { id: artworkId },
        select: { id: true, status: true }
      });
      
      if (!artwork || artwork.status !== "PUBLISHED") {
        return res.code(404).send({ error: "Artwork not found or not published" });
      }
      
      // Create interaction
      await app.prisma.interaction.create({
        data: {
          userId,
          artworkId,
          kind,
          weight: Number(weight)
        }
      });
      
      return res.send({ ok: true });
    } catch (error) {
      console.error("Failed to track interaction:", error);
      return res.code(500).send({ error: "Failed to track interaction" });
    }
  });

  // Get user's recent interactions (for debugging/testing)
  app.get("/interactions", async (req, res) => {
    const userId = (req as any).user?.id as string | undefined;
    if (!userId) {
      return res.code(401).send({ error: "Unauthorized" });
    }
    
    const interactions = await app.prisma.interaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        kind: true,
        weight: true,
        createdAt: true,
        artworkId: true
      }
    });
    
    return res.send({ interactions });
  });
}
