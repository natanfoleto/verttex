import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { requirePermission } from '../../shared/middlewares/require-permission'
import {
  createLotController,
  getLotDetailsController,
  listLotsController,
  updateLotStatusController,
} from './lots.controller'
import {
  createLotBodySchema,
  listLotsQuerySchema,
  updateLotStatusBodySchema,
} from './lots.schemas'

export async function lotsRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>()

  typedApp.post(
    '/',
    {
      preHandler: [app.authenticateUser, requirePermission('create', 'File')], // checked by permission middleware
      schema: {
        tags: ['Lots — Batch Management'],
        summary: 'Cadastrar novo lote de produto',
        security: [{ bearerAuth: [] }],
        body: createLotBodySchema,
      },
    },
    createLotController,
  )

  typedApp.get(
    '/',
    {
      preHandler: [app.authenticateUser],
      schema: {
        tags: ['Lots — Batch Management'],
        summary: 'Listar lotes com filtros de validade e status operacional',
        security: [{ bearerAuth: [] }],
        querystring: listLotsQuerySchema,
      },
    },
    listLotsController,
  )

  typedApp.get(
    '/:lotId',
    {
      preHandler: [app.authenticateUser],
      schema: {
        tags: ['Lots — Batch Management'],
        summary: 'Obter detalhes completos do lote, estoque e movimentações',
        security: [{ bearerAuth: [] }],
        params: z.object({ lotId: z.string() }),
      },
    },
    getLotDetailsController,
  )

  typedApp.patch(
    '/:lotId/status',
    {
      preHandler: [app.authenticateUser],
      schema: {
        tags: ['Lots — Batch Management'],
        summary:
          'Alterar situação operacional do lote (disponível, quarentena, bloqueado, recolhido)',
        security: [{ bearerAuth: [] }],
        params: z.object({ lotId: z.string() }),
        body: updateLotStatusBodySchema,
      },
    },
    updateLotStatusController,
  )
}
