import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { requirePermission } from '../../shared/middlewares/require-permission'
import { listPermissionsController } from './permissions.controller'
import { permissionQuerySchema } from './permissions.schemas'

export async function permissionsRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>()

  typedApp.get(
    '/permissions',
    {
      preHandler: [
        app.authenticateUser,
        requirePermission('read', 'Permission'),
      ],
      schema: {
        tags: ['Roles & Permissions'],
        summary: 'Listar permissões disponíveis do sistema',
        security: [{ bearerAuth: [] }],
        querystring: permissionQuerySchema,
      },
    },
    listPermissionsController
  )
}
