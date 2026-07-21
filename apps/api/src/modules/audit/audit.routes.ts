import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { requirePermission } from '../../shared/middlewares/require-permission'
import { listAuditLogsController } from './audit.controller'
import { auditQuerySchema } from './audit.schemas'

export async function auditRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>()

  typedApp.get(
    '/audit',
    {
      preHandler: [app.authenticateUser, requirePermission('read', 'AuditLog')],
      schema: {
        tags: ['Audit'],
        summary: 'Listar logs de auditoria do sistema',
        security: [{ bearerAuth: [] }],
        querystring: auditQuerySchema,
      },
    },
    listAuditLogsController
  )
}
