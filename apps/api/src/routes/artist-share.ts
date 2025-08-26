import { FastifyInstance } from "fastify";

export default async function routes(app: FastifyInstance) {
  app.get("/artist-share/resolve", async (req, res) => {
    const slug = String((req.query as any)?.slug || "");
    if (!slug) return res.code(400).send({ error: "missing slug" });
    const link = await app.prisma.artistShareLink.findUnique({ where: { slug }});
    if (!link) return res.code(404).send({ error: "not found" });

    // log visit (fără IP/UA; optional source din UTM)
    const url = new URL(req.url, "http://x"); // parse query local
    const source = url.searchParams.get("source") || undefined;
    const utm = Object.fromEntries(Array.from(url.searchParams.entries()).filter(([k])=>k.startsWith("utm_")));
    await app.prisma.artistShareVisit.create({ data: { linkId: link.id, source, utm: Object.keys(utm).length? utm: undefined }});

    // returnăm landing + parametrii utili
    return res.send({
      landing: link.landing || "/",
      asl: slug,
      utm: { utm_source: "artist_share", utm_medium: source || "social", utm_campaign: slug }
    });
  });
}
