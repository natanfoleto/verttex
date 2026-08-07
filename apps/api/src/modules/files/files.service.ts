import { FastifyRequest } from 'fastify'

import { prisma } from '../../infrastructure/database/prisma'
import { r2Storage } from '../../infrastructure/storage/r2'
import { AppError } from '../../shared/errors/app-error'
import {
  StoreAccessActor,
  StoreAccessPolicy,
} from '../../shared/policies/store-access.policy'
import {
  DirectUploadParams,
  UploadService,
} from '../../shared/services/upload.service'
import { logAudit } from '../../shared/utils/audit'
import { FinalizeUploadParams, RequestUploadBody } from './files.schemas'

export class FilesService {
  private static readonly STORE_SCOPED_PURPOSES = new Set([
    'product_image',
    'store_logo',
    'store_banner',
  ])

  private static async assertUploadScope(
    purpose: string,
    storeId: string | null | undefined,
    actor: StoreAccessActor,
  ) {
    if (this.STORE_SCOPED_PURPOSES.has(purpose) && !storeId) {
      throw new AppError(
        'VALIDATION_ERROR',
        'A loja é obrigatória para esta finalidade de upload',
        400,
      )
    }

    if (storeId) {
      await StoreAccessPolicy.assertStoreAccess(actor, storeId)
    }
  }

  private static async findFile(fileId: string) {
    return prisma.file.findFirst({
      where: {
        OR: [{ id: fileId }, { publicId: fileId }],
        deletedAt: null,
      },
    })
  }

  private static async assertFileAccess(
    file: { storeId: string | null; userId: string | null },
    actor: StoreAccessActor,
  ) {
    if (file.storeId) {
      await StoreAccessPolicy.assertStoreAccess(actor, file.storeId)
      return
    }

    if (!StoreAccessPolicy.hasGlobalAccess(actor) && file.userId !== actor.id) {
      throw new AppError(
        'FORBIDDEN',
        'Você não possui acesso a este arquivo',
        403,
      )
    }
  }

  static async requestUpload(
    body: RequestUploadBody,
    actor: StoreAccessActor,
    req?: FastifyRequest,
  ) {
    const userId = actor.id
    await this.assertUploadScope(body.purpose, body.storeId, actor)

    const result = await UploadService.requestUpload({
      fileName: body.fileName,
      mimeType: body.mimeType,
      size: body.size,
      purpose: body.purpose,
      storeId: body.storeId,
      userId,
    })

    await logAudit({
      userId,
      action: 'REQUEST_FILE_UPLOAD',
      entity: 'File',
      entityId: result.fileId,
      newValues: {
        fileName: body.fileName,
        size: body.size,
        purpose: body.purpose,
      },
      req,
    })

    return result
  }

  static async directUpload(
    params: DirectUploadParams,
    actor: StoreAccessActor,
    req?: FastifyRequest,
  ) {
    await this.assertUploadScope(params.purpose, params.storeId, actor)
    const scopedParams = { ...params, userId: actor.id }
    const result = await UploadService.directUpload(scopedParams)

    await logAudit({
      userId: actor.id,
      action: 'UPLOAD_FILE',
      entity: 'File',
      entityId: result.id,
      newValues: {
        fileName: params.fileName,
        size: params.buffer.length,
        purpose: params.purpose,
      },
      req,
    })

    return result
  }

  static async finalizeUpload(
    params: FinalizeUploadParams,
    actor: StoreAccessActor,
    req?: FastifyRequest,
  ) {
    const existing = await this.findFile(params.fileId)
    if (!existing) {
      throw new AppError('NOT_FOUND', 'Registro de arquivo não encontrado', 404)
    }
    await this.assertFileAccess(existing, actor)

    const file = await UploadService.finalizeUpload(params.fileId, actor.id)

    await logAudit({
      userId: actor.id,
      action: 'FINALIZE_FILE_UPLOAD',
      entity: 'File',
      entityId: file.id,
      newValues: { status: file.status, checksum: file.checksum },
      req,
    })

    return file
  }

  static async getFile(fileId: string, actor: StoreAccessActor) {
    const file = await this.findFile(fileId)

    if (!file) return null
    await this.assertFileAccess(file, actor)

    const publicUrl = await r2Storage.getFileUrl(file.objectKey)
    return {
      ...file,
      publicUrl,
    }
  }

  static async deleteFile(
    fileId: string,
    actor: StoreAccessActor,
    req?: FastifyRequest,
  ) {
    const file = await this.findFile(fileId)
    if (!file) return

    await this.assertFileAccess(file, actor)
    await UploadService.deleteFile(file.id)

    await logAudit({
      userId: actor.id,
      action: 'DELETE_FILE',
      entity: 'File',
      entityId: file.id,
      oldValues: {
        purpose: file.purpose,
        storeId: file.storeId,
        objectKey: file.objectKey,
      },
      req,
    })
  }
}
