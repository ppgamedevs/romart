import { FastifyInstance } from "fastify";
import { reindexAll, upsertSearchItem } from "../services/search.sync";

export default async function routes(app:FastifyInstance){
  app.post("/admin/search/reindex", async (_req,res)=>{ await reindexAll(); res.send({ok:true}); });
  app.post("/admin/search/reindex/:id", async (req,res)=>{ await upsertSearchItem((req.params as any).id); res.send({ok:true}); });
}
