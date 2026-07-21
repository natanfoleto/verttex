import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { getHealthHandler } from './health.controller'
import { healthResponseSchema } from './health.schemas'

export async function healthRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/health',
    {
      schema: {
        description: 'Check liveness and readiness status of the backend API',
        tags: ['Health Check'],
        response: {
          200: healthResponseSchema,
        },
      },
    },
    getHealthHandler
  )
}
