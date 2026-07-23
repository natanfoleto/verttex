import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { requirePermission } from '../../shared/middlewares/require-permission'
import { categoriesController } from './categories.controller'
import {
  categoryQuerySchema,
  createCategorySchema,
  updateCategorySchema,
  reorderCategoriesSchema,
} from './categories.schemas'

const idParamsSchema = z.object({
  id: z.string().min(1),
})

export async function categoriesRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>()

  // Public / General Read Routes
  typedApp.get(
    '/',
    {
      schema: {
        querystring: categoryQuerySchema,
      },
    },
    categoriesController.list
  )

  typedApp.get('/tree', categoriesController.getTree)

  typedApp.get(
    '/:id',
    {
      schema: {
        params: idParamsSchema,
      },
    },
    categoriesController.getById
  )

  // Protected Routes (Management users)
  typedApp.post(
    '/',
    {
      preHandler: [app.authenticateUser, requirePermission('create', 'Category')],
      schema: {
        body: createCategorySchema,
      },
    },
    categoriesController.create
  )

  typedApp.patch(
    '/:id',
    {
      preHandler: [app.authenticateUser, requirePermission('update', 'Category')],
      schema: {
        params: idParamsSchema,
        body: updateCategorySchema,
      },
    },
    categoriesController.update
  )

  typedApp.delete(
    '/:id',
    {
      preHandler: [app.authenticateUser, requirePermission('delete', 'Category')],
      schema: {
        params: idParamsSchema,
      },
    },
    categoriesController.delete
  )

  typedApp.post(
    '/reorder',
    {
      preHandler: [app.authenticateUser, requirePermission('update', 'Category')],
      schema: {
        body: reorderCategoriesSchema,
      },
    },
    categoriesController.reorder
  )
}
