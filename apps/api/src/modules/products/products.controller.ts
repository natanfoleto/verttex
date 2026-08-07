import { FastifyReply } from 'fastify'

import { FastifyZodRequest } from '../../@types/fastify'
import { AppError } from '../../shared/errors/app-error'
import {
  CreateProductBody,
  ProductListQuery,
  UpdateProductBody,
} from './products.schemas'
import { ProductsService } from './products.service'

function getActor(request: FastifyZodRequest) {
  const actor = request.userPayload
  if (!actor) {
    throw new AppError('UNAUTHORIZED', 'Usuário não autenticado', 401)
  }
  return actor
}

export async function listProductsController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const actor = getActor(request)
  const query = request.query as ProductListQuery
  const result = await ProductsService.listProducts(query, actor)
  return reply.send({
    success: true,
    ...result,
  })
}

export async function getProductController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const actor = getActor(request)
  const params = request.params as { id: string }
  const product = await ProductsService.getProduct(params.id, actor)
  return reply.send({
    success: true,
    data: product,
  })
}

export async function createProductController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const actor = getActor(request)

  const body = request.body as CreateProductBody
  const product = await ProductsService.createProduct(body, actor, request)

  return reply.status(201).send({
    success: true,
    data: product,
  })
}

export async function updateProductController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const actor = getActor(request)

  const params = request.params as { id: string }
  const body = request.body as UpdateProductBody
  const product = await ProductsService.updateProduct(
    params.id,
    body,
    actor,
    request,
  )

  return reply.send({
    success: true,
    data: product,
  })
}

export async function publishProductController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const actor = getActor(request)

  const params = request.params as { id: string }
  const product = await ProductsService.publishProduct(
    params.id,
    actor,
    request,
  )

  return reply.send({
    success: true,
    data: product,
  })
}

export async function archiveProductController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const actor = getActor(request)

  const params = request.params as { id: string }
  const result = await ProductsService.archiveProduct(params.id, actor, request)

  return reply.send({
    success: true,
    data: result,
  })
}
