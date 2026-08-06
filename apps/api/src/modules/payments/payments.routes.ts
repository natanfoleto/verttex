import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import {
  createChargeController,
  getPaymentStatusController,
  webhookController,
} from './payments.controller'
import {
  createPaymentChargeSchema,
  webhookEventSchema,
} from './payments.schemas'

const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'

export async function paymentsRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>()

  // POST /payments/charge — Protected for Customers
  typedApp.post(
    '/charge',
    {
      preHandler: [app.authenticateCustomer],
      schema: {
        tags: ['Payments'],
        summary: 'Gerar cobrança Pix/Cartão para um pedido',
        security: [{ bearerAuth: [] }],
        body: createPaymentChargeSchema,
      },
    },
    createChargeController,
  )

  // POST /payments/webhook — Gateway Webhook (Unauthenticated endpoint with rate limit and signature verification)
  typedApp.post(
    '/webhook',
    {
      config: {
        rateLimit: {
          max: 60,
          timeWindow: '1 minute',
          keyGenerator: (req) => `webhook:ip:${req.ip}`,
          allowList: () => isDev,
        },
      },
      schema: {
        tags: ['Payments'],
        summary:
          'Receber notificações assíncronas de webhook do gateway de pagamento',
        body: webhookEventSchema,
      },
    },
    webhookController,
  )

  // GET /payments/order/:orderId — Protected for Customers
  typedApp.get(
    '/order/:orderId',
    {
      preHandler: [app.authenticateCustomer],
      schema: {
        tags: ['Payments'],
        summary: 'Consultar status de pagamento de um pedido',
        security: [{ bearerAuth: [] }],
        params: z.object({
          orderId: z.string(),
        }),
      },
    },
    getPaymentStatusController,
  )
}
