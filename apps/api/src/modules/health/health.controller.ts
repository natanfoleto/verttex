import { FastifyReply } from "fastify";
import { FastifyZodRequest } from "../../@types/fastify";
import { formatSuccessResponse } from "../../shared/http/response";

export async function getHealthHandler(
  _request: FastifyZodRequest,
  reply: FastifyReply,
) {
  return reply.send(
    formatSuccessResponse({
      status: "ok",
      timestamp: new Date().toISOString(),
    }),
  );
}
