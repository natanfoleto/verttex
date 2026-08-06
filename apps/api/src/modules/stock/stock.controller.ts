import { FastifyReply } from 'fastify'

import { FastifyZodRequest } from '../../@types/fastify'
import { AppError } from '../../shared/errors/app-error'
import {
  AdjustStockBody,
  DiscardExpiredStockBody,
  ListStockMovementsQuery,
  QueryAvailabilityQuery,
  ReceiveStockBody,
  TransferStockBody,
} from './stock.schemas'
import { StockService } from './stock.service'

export async function receiveStockController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const userId = request.userPayload?.id
  if (!userId) {
    throw new AppError('UNAUTHORIZED', 'Usuário não autenticado', 401)
  }

  const body = request.body as ReceiveStockBody
  const result = await StockService.receiveStock(body, userId, request)

  return reply.status(201).send(result)
}

export async function queryCommercialAvailabilityController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const query = request.query as QueryAvailabilityQuery
  const result = await StockService.queryCommercialAvailability(query)

  return reply.send({
    success: true,
    data: result,
  })
}

export async function adjustStockController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const userId = request.userPayload?.id
  if (!userId) {
    throw new AppError('UNAUTHORIZED', 'Usuário não autenticado', 401)
  }

  const body = request.body as AdjustStockBody
  const result = await StockService.adjustStock(body, userId, request)

  return reply.send({
    success: true,
    data: result,
  })
}

export async function discardExpiredStockController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const userId = request.userPayload?.id
  if (!userId) {
    throw new AppError('UNAUTHORIZED', 'Usuário não autenticado', 401)
  }

  const body = request.body as DiscardExpiredStockBody
  const result = await StockService.discardExpiredStock(body, userId, request)

  return reply.send({
    success: true,
    data: result,
  })
}

export async function transferStockController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const userId = request.userPayload?.id
  if (!userId) {
    throw new AppError('UNAUTHORIZED', 'Usuário não autenticado', 401)
  }

  const body = request.body as TransferStockBody
  const result = await StockService.transferStock(body, userId, request)

  return reply.send(result)
}

export async function listStockMovementsController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const query = request.query as ListStockMovementsQuery
  const result = await StockService.listStockMovements(query)
  return reply.send({
    success: true,
    data: result.data,
    meta: result.meta,
  })
}
