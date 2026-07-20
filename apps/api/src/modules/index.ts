import { FastifyInstance } from "fastify";
import { healthRoutes } from "./health";

export async function registerModules(app: FastifyInstance) {
  await app.register(healthRoutes);
}
