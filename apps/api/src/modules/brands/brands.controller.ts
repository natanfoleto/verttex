import { FastifyReply, FastifyRequest } from 'fastify'
import { FastifyZodRequest } from '../../@types/fastify'
import { brandsService } from './brands.service'
import {
  BrandQuery,
  CreateBrandBody,
  UpdateBrandBody,
} from './brands.schemas'

export class BrandsController {
  async list(
    req: FastifyRequest<{ Querystring: BrandQuery }>,
    reply: FastifyReply
  ) {
    const result = await brandsService.listBrands(req.query)
    return reply.send({
      success: true,
      data: result.data,
      meta: result.meta,
    })
  }

  async getById(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const brand = await brandsService.getBrandById(req.params.id)
    return reply.send({
      success: true,
      data: brand,
    })
  }

  async create(
    req: FastifyZodRequest,
    reply: FastifyReply
  ) {
    const body = req.body as CreateBrandBody
    const brand = await brandsService.createBrand(
      body,
      req.userPayload?.id,
      req
    )
    return reply.status(201).send({
      success: true,
      data: brand,
    })
  }

  async update(
    req: FastifyZodRequest,
    reply: FastifyReply
  ) {
    const params = req.params as { id: string }
    const body = req.body as UpdateBrandBody
    const brand = await brandsService.updateBrand(
      params.id,
      body,
      req.userPayload?.id,
      req
    )
    return reply.send({
      success: true,
      data: brand,
    })
  }

  async delete(
    req: FastifyZodRequest,
    reply: FastifyReply
  ) {
    const params = req.params as { id: string }
    const result = await brandsService.deleteBrand(
      params.id,
      req.userPayload?.id,
      req
    )
    return reply.send({
      success: true,
      data: result,
    })
  }
}

export const brandsController = new BrandsController()
