import { FastifyReply, FastifyRequest } from "fastify";
import { formatSuccessResponse } from "../../shared/http/response";

export async function getHealthHandler(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  return reply.send(
    formatSuccessResponse({
      status: "ok",
      timestamp: new Date().toISOString(),
    }),
  );
}
