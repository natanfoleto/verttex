import { FastifyReply } from 'fastify'

import { FastifyZodRequest } from '../../@types/fastify'
import { AppError } from '../../shared/errors/app-error'
import { FinalizeUploadParams, RequestUploadBody } from './files.schemas'
import { FilesService } from './files.service'

function getActor(request: FastifyZodRequest) {
  const actor = request.userPayload
  if (!actor) {
    throw new AppError('UNAUTHORIZED', 'Usuário não autenticado', 401)
  }
  return actor
}

export async function requestUploadController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const actor = getActor(request)

  const body = request.body as RequestUploadBody
  const result = await FilesService.requestUpload(body, actor, request)

  return reply.status(201).send({
    success: true,
    data: result,
  })
}

export async function directUploadController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const actor = getActor(request)

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

  if (!(validPurposes as readonly string[]).includes(rawPurpose)) {
    throw new AppError('VALIDATION_ERROR', 'Finalidade de upload inválida', 400)
  }

  const purpose = rawPurpose as (typeof validPurposes)[number]

  const result = await FilesService.directUpload(
    {
      fileName: data.filename,
      mimeType: data.mimetype,
      buffer,
      purpose,
      storeId,
    },
    actor,
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
  const actor = getActor(request)

  const params = request.params as FinalizeUploadParams
  const result = await FilesService.finalizeUpload(params, actor, request)

  return reply.send({
    success: true,
    data: result,
  })
}

export async function getFileController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const actor = getActor(request)
  const params = request.params as { fileId: string }
  const file = await FilesService.getFile(params.fileId, actor)
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
  const actor = getActor(request)
  const params = request.params as { fileId: string }
  await FilesService.deleteFile(params.fileId, actor, request)

  return reply.send({
    success: true,
    data: { message: 'Arquivo removido com sucesso!' },
  })
}
