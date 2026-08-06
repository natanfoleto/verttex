import { FastifyReply, FastifyRequest } from 'fastify'

import { FastifyZodRequest } from '../../@types/fastify'
import { logAudit } from '../../shared/utils/audit'
import { carouselService } from './carousel.service'

export class CarouselController {
  async listBanners(_req: FastifyRequest, reply: FastifyReply) {
    const banners = await carouselService.listBanners()
    return reply.send({ success: true, data: banners })
  }

  async listActiveBanners(_req: FastifyRequest, reply: FastifyReply) {
    const banners = await carouselService.listActiveBanners()
    return reply.send({ success: true, data: banners })
  }

  async getBanner(req: FastifyZodRequest, reply: FastifyReply) {
    const params = req.params as { id: string }
    const banner = await carouselService.getBannerById(params.id)
    return reply.send({ success: true, data: banner })
  }

  async createBanner(req: FastifyRequest, reply: FastifyReply) {
    const userId = req.userPayload?.id || 'system'
    const banner = await carouselService.createBanner(
      req.body as Parameters<typeof carouselService.createBanner>[0],
      userId,
    )

    await logAudit({
      userId,
      action: 'CREATE_BANNER',
      entity: 'CarouselBanner',
      entityId: banner.id,
      newValues: banner,
      req,
    })

    return reply.status(201).send({ success: true, data: banner })
  }

  async updateBanner(req: FastifyZodRequest, reply: FastifyReply) {
    const userId = req.userPayload?.id || 'system'
    const params = req.params as { id: string }
    const oldBanner = await carouselService.getBannerById(params.id)
    const updated = await carouselService.updateBanner(
      params.id,
      req.body as Parameters<typeof carouselService.updateBanner>[1],
      userId,
    )

    await logAudit({
      userId,
      action: 'UPDATE_BANNER',
      entity: 'CarouselBanner',
      entityId: updated.id,
      oldValues: oldBanner,
      newValues: updated,
      req,
    })

    return reply.send({ success: true, data: updated })
  }

  async deleteBannerImage(req: FastifyZodRequest, reply: FastifyReply) {
    const userId = req.userPayload?.id || 'system'
    const params = req.params as { id: string }
    const oldBanner = await carouselService.getBannerById(params.id)
    const updated = await carouselService.deleteBannerImage(params.id, userId)

    await logAudit({
      userId,
      action: 'REMOVE_BANNER_IMAGE',
      entity: 'CarouselBanner',
      entityId: params.id,
      oldValues: oldBanner,
      newValues: updated,
      req,
    })

    return reply.send({
      success: true,
      data: updated,
      message: 'Imagem do banner removida com sucesso.',
    })
  }

  async deleteBanner(req: FastifyZodRequest, reply: FastifyReply) {
    const userId = req.userPayload?.id || 'system'
    const params = req.params as { id: string }
    const oldBanner = await carouselService.getBannerById(params.id)
    await carouselService.deleteBanner(params.id)

    await logAudit({
      userId,
      action: 'DELETE_BANNER',
      entity: 'CarouselBanner',
      entityId: params.id,
      oldValues: oldBanner,
      req,
    })

    return reply.send({
      success: true,
      message: 'Banner removido com sucesso.',
    })
  }

  async reorderBanners(req: FastifyRequest, reply: FastifyReply) {
    const userId = req.userPayload?.id || 'system'
    const body = req.body as { items: { id: string; position: number }[] }
    await carouselService.reorderBanners(body.items)

    await logAudit({
      userId,
      action: 'REORDER_BANNERS',
      entity: 'CarouselBanner',
      newValues: req.body,
      req,
    })

    return reply.send({
      success: true,
      message: 'Banners reordenados com sucesso.',
    })
  }
}

export const carouselController = new CarouselController()
