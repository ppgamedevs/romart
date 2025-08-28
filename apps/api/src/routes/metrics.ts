import { FastifyInstance } from "fastify";

export default async function routes(app: FastifyInstance) {
  app.post("/metrics/web-vitals", async (req, res) => {
    const m = req.body as any;
    // TODO: trimite în PostHog/BigQuery/ClickHouse
    app.log.info({ webvitals: m });
    res.code(204).send();
  });
}
