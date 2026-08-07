import { FastifyReply, FastifyRequest } from 'fastify'

import { AppError } from '../../shared/errors/app-error'
import {
  expirationCheckSchema,
  listNotificationsQuerySchema,
} from './notifications.schemas'
import { NotificationsService } from './notifications.service'

function getActor(req: FastifyRequest) {
  const actor = req.userPayload
  if (!actor) {
    throw new AppError('UNAUTHORIZED', 'Usuário não autenticado', 401)
  }
  return actor
}

export async function listUserNotificationsController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const actor = getActor(req)
  const query = listNotificationsQuerySchema.parse(req.query)
  const result = await NotificationsService.listUserNotifications(actor, query)
  return reply.status(200).send({
    success: true,
    data: result,
  })
}

export async function markAsReadController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const actor = getActor(req)
  const { id } = req.params as { id: string }
  const result = await NotificationsService.markAsRead(actor, id)
  return reply.status(200).send({
    success: true,
    data: result,
  })
}

export async function checkLotExpirationsController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const actor = getActor(req)
  const body = expirationCheckSchema.parse(req.body || {})
  const result = await NotificationsService.checkLotExpirations(body, actor)
  return reply.status(200).send({
    success: true,
    data: result,
  })
}
