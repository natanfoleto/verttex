import { FastifyReply } from 'fastify'

import { FastifyZodRequest } from '../../@types/fastify'
import { AppError } from '../../shared/errors/app-error'
import {
  CreateLotBody,
  ListLotsQuery,
  UpdateLotStatusBody,
} from './lots.schemas'
import { LotsService } from './lots.service'

function getActor(request: FastifyZodRequest) {
  const actor = request.userPayload
  if (!actor) {
    throw new AppError('UNAUTHORIZED', 'Usuário não autenticado', 401)
  }
  return actor
}

export async function createLotController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const actor = getActor(request)

  const body = request.body as CreateLotBody
  const result = await LotsService.createLot(body, actor, request)

  return reply.status(201).send({
    success: true,
    data: result,
  })
}

export async function listLotsController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const actor = getActor(request)
  const query = request.query as ListLotsQuery
  const result = await LotsService.listLots(query, actor)

  return reply.send({
    success: true,
    ...result,
  })
}

export async function getLotDetailsController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const actor = getActor(request)
  const params = request.params as { lotId: string }
  const lot = await LotsService.getLotDetails(params.lotId, actor)

  return reply.send({
    success: true,
    data: lot,
  })
}

export async function updateLotStatusController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const actor = getActor(request)

  const params = request.params as { lotId: string }
  const body = request.body as UpdateLotStatusBody

  const result = await LotsService.updateLotStatus(
    params.lotId,
    body,
    actor,
    request,
  )

  return reply.send({
    success: true,
    data: result,
  })
}
