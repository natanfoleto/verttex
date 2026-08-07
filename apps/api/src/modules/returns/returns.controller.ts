import { FastifyReply, FastifyRequest } from 'fastify'

import { AppError } from '../../shared/errors/app-error'
import {
  processRefundSchema,
  quarantineEntrySchema,
  quarantineReleaseSchema,
  requestReturnSchema,
} from './returns.schemas'
import { ReturnsService } from './returns.service'

function getActor(req: FastifyRequest) {
  const actor = req.userPayload
  if (!actor) {
    throw new AppError('UNAUTHORIZED', 'Usuário não autenticado', 401)
  }
  return actor
}

export async function listReturnsController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const actor = getActor(req)
  const query = (req.query || {}) as {
    page?: string
    limit?: string
    perPage?: string
  }
  const result = await ReturnsService.listReturns(actor, query)
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
  const actor = getActor(req)
  const { returnId } = req.params as { returnId: string }
  const body = quarantineEntrySchema.parse(req.body || {})

  const result = await ReturnsService.receiveReturnInQuarantine(
    actor,
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
  const actor = getActor(req)
  const { returnId } = req.params as { returnId: string }
  const body = quarantineReleaseSchema.parse(req.body)

  const result = await ReturnsService.inspectAndReleaseQuarantine(
    actor,
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
  const actor = getActor(req)
  const { returnId } = req.params as { returnId: string }
  const body = processRefundSchema.parse(req.body)

  const result = await ReturnsService.processRefund(actor, returnId, body)
  return reply.status(200).send({
    success: true,
    data: result,
  })
}
