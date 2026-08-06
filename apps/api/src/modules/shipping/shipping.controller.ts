import { FastifyReply, FastifyRequest } from 'fastify'

import {
  dispatchOrderSchema,
  quoteShippingSchema,
  updateTrackingSchema,
} from './shipping.schemas'
import { ShippingService } from './shipping.service'

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
  const userId = req.userPayload?.id || 'system'
  const { orderId } = req.params as { orderId: string }
  const body = dispatchOrderSchema.parse(req.body)

  const result = await ShippingService.dispatchOrder(userId, orderId, body)
  return reply.status(200).send({
    success: true,
    data: result,
  })
}

export async function updateTrackingController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = req.userPayload?.id || 'system'
  const { orderId } = req.params as { orderId: string }
  const body = updateTrackingSchema.parse(req.body)

  const result = await ShippingService.updateTracking(userId, orderId, body)
  return reply.status(200).send({
    success: true,
    data: result,
  })
}

export async function markAsDeliveredController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = req.userPayload?.id || 'system'
  const { orderId } = req.params as { orderId: string }

  const result = await ShippingService.markAsDelivered(userId, orderId)
  return reply.status(200).send({
    success: true,
    data: result,
  })
}
