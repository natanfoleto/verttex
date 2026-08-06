import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import {
  inspectAndReleaseQuarantineController,
  listReturnsController,
  processRefundController,
  receiveReturnInQuarantineController,
  requestReturnController,
} from './returns.controller'
import {
  processRefundSchema,
  quarantineEntrySchema,
  quarantineReleaseSchema,
  requestReturnSchema,
} from './returns.schemas'

export async function returnsRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>()

  // GET /returns — Protected for Management Users
  typedApp.get(
    '/',
    {
      preHandler: [app.authenticateUser],
      schema: {
        tags: ['Returns & Quarantine'],
        summary: 'Listar solicitações de devolução para o Verttex Manager',
        security: [{ bearerAuth: [] }],
      },
    },
    listReturnsController,
  )

  // POST /returns/request — Protected for Customers
  typedApp.post(
    '/request',
    {
      preHandler: [app.authenticateCustomer],
      schema: {
        tags: ['Returns & Quarantine'],
        summary: 'Solicitar devolução de um pedido entregue',
        security: [{ bearerAuth: [] }],
        body: requestReturnSchema,
      },
    },
    requestReturnController,
  )

  // POST /returns/:returnId/quarantine-entry — Protected for Management Users
  typedApp.post(
    '/:returnId/quarantine-entry',
    {
      preHandler: [app.authenticateUser],
      schema: {
        tags: ['Returns & Quarantine'],
        summary:
          'Registrar recebimento e entrada em Quarentena Sanitária compulsória',
        security: [{ bearerAuth: [] }],
        params: z.object({ returnId: z.string() }),
        body: quarantineEntrySchema,
      },
    },
    receiveReturnInQuarantineController,
  )

  // POST /returns/:returnId/quarantine-release — Protected for Management Users
  typedApp.post(
    '/:returnId/quarantine-release',
    {
      preHandler: [app.authenticateUser],
      schema: {
        tags: ['Returns & Quarantine'],
        summary:
          'Registrar laudo de inspeção sanitária e liberação/descarte da quarentena',
        security: [{ bearerAuth: [] }],
        params: z.object({ returnId: z.string() }),
        body: quarantineReleaseSchema,
      },
    },
    inspectAndReleaseQuarantineController,
  )

  // POST /returns/:returnId/refund — Protected for Management Users
  typedApp.post(
    '/:returnId/refund',
    {
      preHandler: [app.authenticateUser],
      schema: {
        tags: ['Returns & Quarantine'],
        summary: 'Processar reembolso de uma devolução aprovada',
        security: [{ bearerAuth: [] }],
        params: z.object({ returnId: z.string() }),
        body: processRefundSchema,
      },
    },
    processRefundController,
  )
}
