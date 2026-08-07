import { FastifyReply, FastifyRequest } from 'fastify'

import { AppError } from '../../shared/errors/app-error'
import {
  dateRangeQuerySchema,
  exportReportsQuerySchema,
} from './reports.schemas'
import { ReportsService } from './reports.service'

function getActor(req: FastifyRequest) {
  const actor = req.userPayload
  if (!actor) {
    throw new AppError('UNAUTHORIZED', 'Usuário não autenticado', 401)
  }
  return actor
}

export async function getSalesSummaryController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const actor = getActor(req)
  const query = dateRangeQuerySchema.parse(req.query)
  const result = await ReportsService.getSalesSummary(query, actor)
  return reply.status(200).send({
    success: true,
    data: result,
  })
}

export async function getTopProductsAndAbcController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const actor = getActor(req)
  const query = dateRangeQuerySchema.parse(req.query)
  const result = await ReportsService.getTopProductsAndAbc(query, actor)
  return reply.status(200).send({
    success: true,
    data: result,
  })
}

export async function getInventoryLossesReportController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const actor = getActor(req)
  const query = dateRangeQuerySchema.parse(req.query)
  const result = await ReportsService.getInventoryLossesReport(query, actor)
  return reply.status(200).send({
    success: true,
    data: result,
  })
}

export async function exportReportController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const actor = getActor(req)
  const query = exportReportsQuerySchema.parse(req.query)

  const result = await ReportsService.exportReport(actor, query)
  return reply
    .status(200)
    .header('Content-Type', result.contentType)
    .send(result.content)
}
