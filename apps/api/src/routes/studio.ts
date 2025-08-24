import { FastifyInstance } from "fastify";
import { digitalRoutes } from "./studio/digital";

export async function studioRoutes(fastify: FastifyInstance) {
  await fastify.register(digitalRoutes, { prefix: "/digital" });
}
