import { FastifyReply, FastifyRequest } from "fastify";
import { ReturnsService } from "./returns.service";
import {
  requestReturnSchema,
  quarantineEntrySchema,
  quarantineReleaseSchema,
  processRefundSchema,
} from "./returns.schemas";

export async function listReturnsController(
  _req: FastifyRequest,
  reply: FastifyReply,
) {
  const result = await ReturnsService.listReturns();
  return reply.status(200).send({
    success: true,
    data: result,
  });
}

export async function requestReturnController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const customerId = (req as any).customer?.id || (req as any).customerPayload?.id;
  const body = requestReturnSchema.parse(req.body);
  const result = await ReturnsService.requestReturn(customerId, body);
  return reply.status(201).send({
    success: true,
    data: result,
  });
}

export async function receiveReturnInQuarantineController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = (req as any).userPayload?.id || (req as any).user?.id || "system";
  const { returnId } = req.params as { returnId: string };
  const body = quarantineEntrySchema.parse(req.body || {});

  const result = await ReturnsService.receiveReturnInQuarantine(userId, returnId, body);
  return reply.status(200).send({
    success: true,
    data: result,
  });
}

export async function inspectAndReleaseQuarantineController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = (req as any).userPayload?.id || (req as any).user?.id || "system";
  const { returnId } = req.params as { returnId: string };
  const body = quarantineReleaseSchema.parse(req.body);

  const result = await ReturnsService.inspectAndReleaseQuarantine(userId, returnId, body);
  return reply.status(200).send({
    success: true,
    data: result,
  });
}

export async function processRefundController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = (req as any).userPayload?.id || (req as any).user?.id || "system";
  const { returnId } = req.params as { returnId: string };
  const body = processRefundSchema.parse(req.body);

  const result = await ReturnsService.processRefund(userId, returnId, body);
  return reply.status(200).send({
    success: true,
    data: result,
  });
}
