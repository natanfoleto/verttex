import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { requirePermission } from '../../shared/middlewares/require-permission'
import {
  listUsersController,
  createUserController,
  getUserController,
  updateUserController,
  deleteUserController,
  getUserStoresController,
  getUserPermissionsController,
  updateUserPermissionsController,
} from './users.controller'
import {
  userParamsSchema,
  userQuerySchema,
  createUserBodySchema,
  updateUserBodySchema,
  updateUserPermissionsBodySchema,
} from './users.schemas'

export async function usersRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>()

  typedApp.get(
    '/users',
    {
      preHandler: [app.authenticateUser, requirePermission('read', 'User')],
      schema: {
        tags: ['Users Management'],
        summary: 'Listar usuários gestores',
        security: [{ bearerAuth: [] }],
        querystring: userQuerySchema,
      },
    },
    listUsersController
  )

  typedApp.post(
    '/users',
    {
      preHandler: [app.authenticateUser, requirePermission('create', 'User')],
      schema: {
        tags: ['Users Management'],
        summary: 'Criar novo usuário gestor',
        security: [{ bearerAuth: [] }],
        body: createUserBodySchema,
      },
    },
    createUserController
  )

  typedApp.get(
    '/users/:userId',
    {
      preHandler: [app.authenticateUser, requirePermission('read', 'User')],
      schema: {
        tags: ['Users Management'],
        summary: 'Consultar detalhes de um usuário gestor',
        security: [{ bearerAuth: [] }],
        params: userParamsSchema,
      },
    },
    getUserController
  )

  typedApp.patch(
    '/users/:userId',
    {
      preHandler: [app.authenticateUser, requirePermission('update', 'User')],
      schema: {
        tags: ['Users Management'],
        summary: 'Atualizar dados de um usuário gestor',
        security: [{ bearerAuth: [] }],
        params: userParamsSchema,
        body: updateUserBodySchema,
      },
    },
    updateUserController
  )

  typedApp.delete(
    '/users/:userId',
    {
      preHandler: [app.authenticateUser, requirePermission('delete', 'User')],
      schema: {
        tags: ['Users Management'],
        summary: 'Desativar um usuário gestor',
        security: [{ bearerAuth: [] }],
        params: userParamsSchema,
      },
    },
    deleteUserController
  )

  typedApp.get(
    '/users/:userId/stores',
    {
      preHandler: [app.authenticateUser, requirePermission('read', 'User')],
      schema: {
        tags: ['Users Management'],
        summary: 'Listar lojas vinculadas ao usuário gestor',
        security: [{ bearerAuth: [] }],
        params: userParamsSchema,
      },
    },
    getUserStoresController
  )

  typedApp.get(
    '/users/:userId/permissions',
    {
      preHandler: [
        app.authenticateUser,
        requirePermission('read', 'Permission'),
      ],
      schema: {
        tags: ['Users Management'],
        summary: 'Consultar exceções individuais de permissões do usuário',
        security: [{ bearerAuth: [] }],
        params: userParamsSchema,
      },
    },
    getUserPermissionsController
  )

  typedApp.put(
    '/users/:userId/permissions',
    {
      preHandler: [
        app.authenticateUser,
        requirePermission('manage', 'Permission'),
      ],
      schema: {
        tags: ['Users Management'],
        summary: 'Definir exceções individuais de permissões do usuário',
        security: [{ bearerAuth: [] }],
        params: userParamsSchema,
        body: updateUserPermissionsBodySchema,
      },
    },
    updateUserPermissionsController
  )
}
