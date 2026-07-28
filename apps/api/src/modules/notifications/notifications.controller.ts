import { FastifyReply, FastifyRequest } from "fastify";
import { NotificationsService } from "./notifications.service";
import { listNotificationsQuerySchema, expirationCheckSchema } from "./notifications.schemas";

export async function listUserNotificationsController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const userId =
    (req as any).userPayload?.id ||
    (req as any).user?.id ||
    (req as any).customer?.id ||
    (req as any).customerPayload?.id ||
    "system-manager";

  const query = listNotificationsQuerySchema.parse(req.query);
  const result = await NotificationsService.listUserNotifications(userId, query);
  return reply.status(200).send({
    success: true,
    data: result,
  });
}

export async function markAsReadController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const userId =
    (req as any).userPayload?.id ||
    (req as any).user?.id ||
    (req as any).customer?.id ||
    (req as any).customerPayload?.id ||
    "system-manager";

  const { id } = req.params as { id: string };
  const result = await NotificationsService.markAsRead(userId, id);
  return reply.status(200).send({
    success: true,
    data: result,
  });
}

export async function checkLotExpirationsController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const body = expirationCheckSchema.parse(req.body || {});
  const result = await NotificationsService.checkLotExpirations(body);
  return reply.status(200).send({
    success: true,
    data: result,
  });
}
