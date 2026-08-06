import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { requirePermission } from '../../shared/middlewares/require-permission'
import { requireStoreAccess } from '../../shared/middlewares/require-store-access'
import {
  addStoreMemberController,
  createStoreController,
  deleteStoreController,
  getStoreController,
  getStoreSummaryController,
  listStoreMembersController,
  listStoresController,
  removeStoreLogoController,
  removeStoreMemberController,
  updateStoreController,
  uploadStoreLogoController,
} from './stores.controller'
import {
  addStoreMemberBodySchema,
  createStoreBodySchema,
  storeMemberParamsSchema,
  storeParamsSchema,
  storeQuerySchema,
  updateStoreBodySchema,
} from './stores.schemas'

export async function storesRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>()

  typedApp.get(
    '/stores',
    {
      preHandler: [app.authenticateUser, requirePermission('read', 'Store')],
      schema: {
        tags: ['Stores Management'],
        summary: 'Listar lojas parceiras (escopadas por permissão e vinculo)',
        security: [{ bearerAuth: [] }],
        querystring: storeQuerySchema,
      },
    },
    listStoresController,
  )

  typedApp.post(
    '/stores',
    {
      preHandler: [app.authenticateUser, requirePermission('create', 'Store')],
      schema: {
        tags: ['Stores Management'],
        summary: 'Criar nova loja parceira',
        security: [{ bearerAuth: [] }],
        body: createStoreBodySchema,
      },
    },
    createStoreController,
  )

  typedApp.get(
    '/stores/:storeId',
    {
      preHandler: [
        app.authenticateUser,
        requirePermission('read', 'Store'),
        requireStoreAccess('storeId'),
      ],
      schema: {
        tags: ['Stores Management'],
        summary: 'Consultar detalhes de uma loja parceira',
        security: [{ bearerAuth: [] }],
        params: storeParamsSchema,
      },
    },
    getStoreController,
  )

  typedApp.get(
    '/stores/:storeId/summary',
    {
      preHandler: [
        app.authenticateUser,
        requirePermission('read', 'Store'),
        requireStoreAccess('storeId'),
      ],
      schema: {
        tags: ['Stores Management'],
        summary: 'Resumo executivo de métricas operacionais e KPIs da loja',
        security: [{ bearerAuth: [] }],
        params: storeParamsSchema,
      },
    },
    getStoreSummaryController,
  )

  typedApp.patch(
    '/stores/:storeId',
    {
      preHandler: [
        app.authenticateUser,
        requirePermission('update', 'Store'),
        requireStoreAccess('storeId'),
      ],
      schema: {
        tags: ['Stores Management'],
        summary: 'Atualizar dados de uma loja parceira',
        security: [{ bearerAuth: [] }],
        params: storeParamsSchema,
        body: updateStoreBodySchema,
      },
    },
    updateStoreController,
  )

  typedApp.post(
    '/stores/:storeId/logo',
    {
      preHandler: [
        app.authenticateUser,
        requirePermission('update', 'Store'),
        requireStoreAccess('storeId'),
      ],
      schema: {
        tags: ['Stores Management'],
        summary:
          'Upload ou substituição da foto de perfil da loja no Cloudflare R2',
        security: [{ bearerAuth: [] }],
        params: storeParamsSchema,
      },
    },
    uploadStoreLogoController,
  )

  typedApp.delete(
    '/stores/:storeId/logo',
    {
      preHandler: [
        app.authenticateUser,
        requirePermission('update', 'Store'),
        requireStoreAccess('storeId'),
      ],
      schema: {
        tags: ['Stores Management'],
        summary: 'Remover foto de perfil da loja',
        security: [{ bearerAuth: [] }],
        params: storeParamsSchema,
      },
    },
    removeStoreLogoController,
  )

  typedApp.delete(
    '/stores/:storeId',
    {
      preHandler: [
        app.authenticateUser,
        requirePermission('delete', 'Store'),
        requireStoreAccess('storeId'),
      ],
      schema: {
        tags: ['Stores Management'],
        summary: 'Desativar uma loja parceira (soft delete)',
        security: [{ bearerAuth: [] }],
        params: storeParamsSchema,
      },
    },
    deleteStoreController,
  )

  typedApp.get(
    '/stores/:storeId/users',
    {
      preHandler: [
        app.authenticateUser,
        requirePermission('manage-members', 'Store'),
        requireStoreAccess('storeId'),
      ],
      schema: {
        tags: ['Stores Management'],
        summary: 'Listar usuários/membros vinculados a uma loja',
        security: [{ bearerAuth: [] }],
        params: storeParamsSchema,
      },
    },
    listStoreMembersController,
  )

  typedApp.post(
    '/stores/:storeId/users',
    {
      preHandler: [
        app.authenticateUser,
        requirePermission('manage-members', 'Store'),
        requireStoreAccess('storeId'),
      ],
      schema: {
        tags: ['Stores Management'],
        summary: 'Vincular um usuário/membro a uma loja',
        security: [{ bearerAuth: [] }],
        params: storeParamsSchema,
        body: addStoreMemberBodySchema,
      },
    },
    addStoreMemberController,
  )

  typedApp.delete(
    '/stores/:storeId/users/:userId',
    {
      preHandler: [
        app.authenticateUser,
        requirePermission('manage-members', 'Store'),
        requireStoreAccess('storeId'),
      ],
      schema: {
        tags: ['Stores Management'],
        summary: 'Desvincular um usuário/membro de uma loja',
        security: [{ bearerAuth: [] }],
        params: storeMemberParamsSchema,
      },
    },
    removeStoreMemberController,
  )
}
