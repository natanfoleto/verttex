import { FastifyReply, FastifyRequest } from 'fastify'

import { logAudit } from '../../shared/utils/audit'
import { marketplaceService } from './marketplace.service'

export class MarketplaceController {
  async getSettings(_req: FastifyRequest, reply: FastifyReply) {
    const settings = await marketplaceService.getSettings()
    return reply.send({ success: true, data: settings })
  }

  async getPublicSettings(_req: FastifyRequest, reply: FastifyReply) {
    const settings = await marketplaceService.getPublicSettings()
    return reply.send({ success: true, data: settings })
  }

  async updateSettings(req: FastifyRequest, reply: FastifyReply) {
    const userId = req.userPayload?.id || 'system'
    const oldSettings = await marketplaceService.getSettings()
    const updated = await marketplaceService.updateSettings(
      req.body as Parameters<typeof marketplaceService.updateSettings>[0],
      userId,
    )

    await logAudit({
      userId,
      action: 'UPDATE_SETTINGS',
      entity: 'MarketplaceSettings',
      entityId: updated.id,
      oldValues: oldSettings,
      newValues: updated,
      req,
    })

    return reply.send({ success: true, data: updated })
  }
}

export const marketplaceController = new MarketplaceController()
