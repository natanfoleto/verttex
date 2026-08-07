import { FastifyReply, FastifyRequest } from 'fastify'

import { AppError } from '../../shared/errors/app-error'
import {
  dispatchOrderSchema,
  quoteShippingSchema,
  updateTrackingSchema,
} from './shipping.schemas'
import { ShippingService } from './shipping.service'

function getActor(req: FastifyRequest) {
  const actor = req.userPayload
  if (!actor) {
    throw new AppError('UNAUTHORIZED', 'Usuário não autenticado', 401)
  }
  return actor
}

export async function quoteShippingController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const body = quoteShippingSchema.parse(req.body)
  const result = await ShippingService.quoteShipping(body)
  return reply.status(200).send({
    success: true,
    data: result,
  })
}

export async function dispatchOrderController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const actor = getActor(req)
  const { orderId } = req.params as { orderId: string }
  const body = dispatchOrderSchema.parse(req.body)

  const result = await ShippingService.dispatchOrder(actor, orderId, body)
  return reply.status(200).send({
    success: true,
    data: result,
  })
}

export async function updateTrackingController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const actor = getActor(req)
  const { orderId } = req.params as { orderId: string }
  const body = updateTrackingSchema.parse(req.body)

  const result = await ShippingService.updateTracking(actor, orderId, body)
  return reply.status(200).send({
    success: true,
    data: result,
  })
}

export async function markAsDeliveredController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const actor = getActor(req)
  const { orderId } = req.params as { orderId: string }

  const result = await ShippingService.markAsDelivered(actor, orderId)
  return reply.status(200).send({
    success: true,
    data: result,
  })
}
