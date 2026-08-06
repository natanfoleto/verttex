import { FastifyReply } from 'fastify'

import { FastifyZodRequest } from '../../@types/fastify'
import { AppError } from '../../shared/errors/app-error'
import { UploadService } from '../../shared/services/upload.service'
import { FinalizeUploadParams, RequestUploadBody } from './files.schemas'
import { FilesService } from './files.service'

export async function requestUploadController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const userId = request.userPayload?.id
  if (!userId) {
    throw new AppError('UNAUTHORIZED', 'Usuário não autenticado', 401)
  }

  const body = request.body as RequestUploadBody
  const result = await FilesService.requestUpload(body, userId, request)

  return reply.status(201).send({
    success: true,
    data: result,
  })
}

export async function directUploadController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const userId = request.userPayload?.id
  if (!userId) {
    throw new AppError('UNAUTHORIZED', 'Usuário não autenticado', 401)
  }

  const data = await request.file()
  if (!data) {
    throw new AppError('VALIDATION_ERROR', 'Nenhum arquivo enviado', 400)
  }

  const buffer = await data.toBuffer()
  const fields = data.fields as Record<string, { value?: string } | undefined>
  const rawPurpose = fields.purpose?.value || 'product_image'
  const storeId = fields.storeId?.value || null

  const validPurposes = [
    'product_image',
    'category_icon',
    'brand_logo',
    'store_logo',
    'store_banner',
    'marketplace_logo',
    'marketplace_favicon',
    'marketplace_og_image',
    'marketplace_banner',
    'user_avatar',
  ] as const

  const purpose = (validPurposes as readonly string[]).includes(rawPurpose)
    ? (rawPurpose as (typeof validPurposes)[number])
    : 'product_image'

  const result = await FilesService.directUpload(
    {
      fileName: data.filename,
      mimeType: data.mimetype,
      buffer,
      purpose,
      storeId,
      userId,
    },
    request,
  )

  return reply.status(201).send({
    success: true,
    data: result,
  })
}

export async function finalizeUploadController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const userId = request.userPayload?.id
  if (!userId) {
    throw new AppError('UNAUTHORIZED', 'Usuário não autenticado', 401)
  }

  const params = request.params as FinalizeUploadParams
  const result = await FilesService.finalizeUpload(params, userId, request)

  return reply.send({
    success: true,
    data: result,
  })
}

export async function getFileController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const params = request.params as { fileId: string }
  const file = await FilesService.getFile(params.fileId)
  if (!file) {
    throw new AppError('NOT_FOUND', 'Arquivo não encontrado', 404)
  }

  return reply.send({
    success: true,
    data: file,
  })
}

export async function deleteFileController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const params = request.params as { fileId: string }
  await UploadService.deleteFile(params.fileId)

  return reply.send({
    success: true,
    data: { message: 'Arquivo removido com sucesso!' },
  })
}
