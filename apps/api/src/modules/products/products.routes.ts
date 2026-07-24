import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { requirePermission } from '../../shared/middlewares/require-permission'
import {
  archiveProductController,
  createProductController,
  getProductController,
  listProductsController,
  publishProductController,
  updateProductController,
} from './products.controller'
import {
  createProductBodySchema,
  productListQuerySchema,
  updateProductBodySchema,
} from './products.schemas'

export async function productsRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>()

  typedApp.get(
    '/',
    {
      preHandler: [app.authenticateUser, requirePermission('read', 'Product')],
      schema: {
        tags: ['Products — Catalog'],
        summary: 'Listar produtos com paginação e filtros',
        security: [{ bearerAuth: [] }],
        querystring: productListQuerySchema,
      },
    },
    listProductsController
  )

  typedApp.get(
    '/:id',
    {
      preHandler: [app.authenticateUser, requirePermission('read', 'Product')],
      schema: {
        tags: ['Products — Catalog'],
        summary: 'Obter produto por ID ou slug',
        security: [{ bearerAuth: [] }],
        params: z.object({ id: z.string() }),
      },
    },
    getProductController
  )

  typedApp.post(
    '/',
    {
      preHandler: [app.authenticateUser, requirePermission('create', 'Product')],
      schema: {
        tags: ['Products — Catalog'],
        summary: 'Cadastrar novo produto (simples ou variável)',
        security: [{ bearerAuth: [] }],
        body: createProductBodySchema,
      },
    },
    createProductController
  )

  typedApp.patch(
    '/:id',
    {
      preHandler: [app.authenticateUser, requirePermission('update', 'Product')],
      schema: {
        tags: ['Products — Catalog'],
        summary: 'Atualizar informações do produto',
        security: [{ bearerAuth: [] }],
        params: z.object({ id: z.string() }),
        body: updateProductBodySchema,
      },
    },
    updateProductController
  )

  typedApp.post(
    '/:id/publish',
    {
      preHandler: [app.authenticateUser, requirePermission('update', 'Product')],
      schema: {
        tags: ['Products — Catalog'],
        summary: 'Publicar produto no Marketplace após validação de prontidão',
        security: [{ bearerAuth: [] }],
        params: z.object({ id: z.string() }),
      },
    },
    publishProductController
  )

  typedApp.delete(
    '/:id',
    {
      preHandler: [app.authenticateUser, requirePermission('delete', 'Product')],
      schema: {
        tags: ['Products — Catalog'],
        summary: 'Arquivar produto (soft-delete)',
        security: [{ bearerAuth: [] }],
        params: z.object({ id: z.string() }),
      },
    },
    archiveProductController
  )
}
