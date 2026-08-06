import { FastifyReply, FastifyRequest } from 'fastify'

import {
  processRefundSchema,
  quarantineEntrySchema,
  quarantineReleaseSchema,
  requestReturnSchema,
} from './returns.schemas'
import { ReturnsService } from './returns.service'

export async function listReturnsController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const query = (req.query || {}) as {
    page?: string
    limit?: string
    perPage?: string
  }
  const result = await ReturnsService.listReturns(query)
  return reply.status(200).send({
    success: true,
    data: result.data,
    meta: result.meta,
  })
}

export async function requestReturnController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const customerId = req.customer?.id || req.customerPayload?.id || ''
  const body = requestReturnSchema.parse(req.body)
  const result = await ReturnsService.requestReturn(customerId, body)
  return reply.status(201).send({
    success: true,
    data: result,
  })
}

export async function receiveReturnInQuarantineController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = req.userPayload?.id || 'system'
  const { returnId } = req.params as { returnId: string }
  const body = quarantineEntrySchema.parse(req.body || {})

  const result = await ReturnsService.receiveReturnInQuarantine(
    userId,
    returnId,
    body,
  )
  return reply.status(200).send({
    success: true,
    data: result,
  })
}

export async function inspectAndReleaseQuarantineController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = req.userPayload?.id || 'system'
  const { returnId } = req.params as { returnId: string }
  const body = quarantineReleaseSchema.parse(req.body)

  const result = await ReturnsService.inspectAndReleaseQuarantine(
    userId,
    returnId,
    body,
  )
  return reply.status(200).send({
    success: true,
    data: result,
  })
}

export async function processRefundController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = req.userPayload?.id || 'system'
  const { returnId } = req.params as { returnId: string }
  const body = processRefundSchema.parse(req.body)

  const result = await ReturnsService.processRefund(userId, returnId, body)
  return reply.status(200).send({
    success: true,
    data: result,
  })
}
