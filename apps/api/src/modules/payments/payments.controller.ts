import { FastifyReply, FastifyRequest } from "fastify";
import { PaymentsService } from "./payments.service";
import { createPaymentChargeSchema, webhookEventSchema } from "./payments.schemas";

export async function createChargeController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const customerId = (req as any).customer?.id || (req as any).customerPayload?.id;
  const body = createPaymentChargeSchema.parse(req.body);
  const result = await PaymentsService.createCharge(customerId, body);
  return reply.status(201).send({
    success: true,
    data: result,
  });
}

export async function webhookController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const body = webhookEventSchema.parse(req.body);
  const result = await PaymentsService.processWebhook(body);
  return reply.status(200).send({
    success: true,
    data: result,
  });
}

export async function getPaymentStatusController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const customerId = (req as any).customer?.id || (req as any).customerPayload?.id;
  const { orderId } = req.params as { orderId: string };
  const result = await PaymentsService.getPaymentStatus(customerId, orderId);
  return reply.status(200).send({
    success: true,
    data: result,
  });
}
