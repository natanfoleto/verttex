import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { requirePermission } from '../../shared/middlewares/require-permission'
import {
  deleteFileController,
  directUploadController,
  finalizeUploadController,
  getFileController,
  requestUploadController,
} from './files.controller'
import {
  finalizeUploadParamsSchema,
  requestUploadBodySchema,
} from './files.schemas'

export async function filesRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>()

  typedApp.post(
    '/presigned-url',
    {
      preHandler: [app.authenticateUser, requirePermission('create', 'File')],
      schema: {
        tags: ['Files — Media Management'],
        summary: 'Solicitar URL pré-assinada para upload direto de arquivo',
        security: [{ bearerAuth: [] }],
        body: requestUploadBodySchema,
      },
    },
    requestUploadController,
  )

  typedApp.post(
    '/upload',
    {
      preHandler: [app.authenticateUser, requirePermission('create', 'File')],
      schema: {
        tags: ['Files — Media Management'],
        summary:
          'Upload direto multipart/form-data de arquivo para Cloudflare R2',
        security: [{ bearerAuth: [] }],
      },
    },
    directUploadController,
  )

  typedApp.post(
    '/:fileId/finalize',
    {
      preHandler: [app.authenticateUser, requirePermission('create', 'File')],
      schema: {
        tags: ['Files — Media Management'],
        summary: 'Finalizar e aprovar upload de arquivo server-side',
        security: [{ bearerAuth: [] }],
        params: finalizeUploadParamsSchema,
      },
    },
    finalizeUploadController,
  )

  typedApp.get(
    '/:fileId',
    {
      preHandler: [app.authenticateUser, requirePermission('read', 'File')],
      schema: {
        tags: ['Files — Media Management'],
        summary: 'Obter metadados do arquivo',
        security: [{ bearerAuth: [] }],
        params: z.object({ fileId: z.string() }),
      },
    },
    getFileController,
  )

  typedApp.delete(
    '/:fileId',
    {
      preHandler: [app.authenticateUser, requirePermission('delete', 'File')],
      schema: {
        tags: ['Files — Media Management'],
        summary:
          'Deletar arquivo permanentemente do Cloudflare R2 e do banco de dados',
        security: [{ bearerAuth: [] }],
        params: z.object({ fileId: z.string() }),
      },
    },
    deleteFileController,
  )
}
