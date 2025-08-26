import { FastifyInstance } from "fastify";

export default async function routes(app: FastifyInstance) {
  app.post("/cart/add", async (req, res) => {
    const { artworkId, editionId, qty } = (req.body as any) || {};
    if (!artworkId || !editionId || !qty) return res.code(400).send({ error: "missing fields" });

    // TODO: leagă de sesiunea userului / cookie; aici doar validăm ediția
    const ed = await app.prisma.edition.findUnique({ 
      where: { id: String(editionId) }, 
      select: { id: true, unitAmount: true, label: true, stock: true } 
    });
    if (!ed) return res.code(404).send({ error: "edition not found" });
    if (ed.stock != null && ed.stock < qty) return res.code(400).send({ error: "not enough stock" });

    // în app-ul tău real: scrie în cart DB / Redis / session. Aici doar răspundem OK.
    return res.send({ ok: true, item: { editionId, qty } });
  });
}
