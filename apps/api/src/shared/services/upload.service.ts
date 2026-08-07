import { randomUUID } from 'node:crypto'

import { apiEnv } from '@verttex/env/api'

import { prisma } from '../../infrastructure/database/prisma'
import { r2Storage } from '../../infrastructure/storage/r2'
import { AppError } from '../errors/app-error'
import { processImageUpload } from './image-processing.service'

export type UploadPurpose =
  | 'product_image'
  | 'category_icon'
  | 'brand_logo'
  | 'store_logo'
  | 'store_banner'
  | 'marketplace_logo'
  | 'marketplace_favicon'
  | 'marketplace_og_image'
  | 'marketplace_banner'
  | 'user_avatar'

const PURPOSE_FOLDER_MAP: Record<UploadPurpose, string> = {
  product_image: 'catalog/products',
  category_icon: 'catalog/categories',
  brand_logo: 'catalog/brands',
  store_logo: 'stores/logos',
  store_banner: 'stores/banners',
  marketplace_logo: 'marketplace/logos',
  marketplace_favicon: 'marketplace/favicons',
  marketplace_og_image: 'marketplace/og-images',
  marketplace_banner: 'marketplace/banners',
  user_avatar: 'users/avatars',
}

export interface RequestUploadParams {
  fileName: string
  mimeType: string
  size: number
  purpose: UploadPurpose
  storeId?: string | null
  userId?: string | null
}

export interface DirectUploadParams {
  fileName: string
  mimeType: string
  buffer: Buffer
  purpose: UploadPurpose
  storeId?: string | null
  userId?: string | null
}

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

function sanitizeOriginalName(fileName: string): string {
  const baseName = fileName.split(/[\\/]/).pop() || 'arquivo'
  return [...baseName]
    .filter((character) => {
      const codePoint = character.codePointAt(0) ?? 0
      return codePoint > 31 && codePoint !== 127
    })
    .join('')
    .slice(0, 255)
}

export class UploadService {
  /**
   * Generates presigned URL metadata and creates pending File record
   */
  static async requestUpload(params: RequestUploadParams) {
    const { fileName, mimeType, size, purpose, storeId, userId } = params

    if (size > MAX_FILE_SIZE_BYTES) {
      throw new AppError(
        'VALIDATION_ERROR',
        `O tamanho do arquivo excede o limite máximo permitido de 5 MB (${Math.round(size / 1024 / 1024)} MB enviado)`,
        400,
      )
    }

    const extension = ALLOWED_MIME_TYPES[mimeType.toLowerCase()]
    if (!extension) {
      throw new AppError(
        'VALIDATION_ERROR',
        `Formato de arquivo não suportado (${mimeType}). Formatos aceitos: JPEG, PNG, WebP. SVGs e scripts são desativados por segurança.`,
        400,
      )
    }

    // Generate safe non-predictable object key
    const uniqueId = randomUUID()
    const folder = PURPOSE_FOLDER_MAP[purpose] || 'uncategorized'
    const objectKey = `uploads/${folder}/${uniqueId}.${extension}`
    const bucket = apiEnv.R2_BUCKET_NAME || 'verttex'

    // Create File database record in 'pending' status
    const file = await prisma.file.create({
      data: {
        provider: r2Storage.isConfigured ? 'cloudflare_r2' : 'local',
        bucket,
        objectKey,
        originalName: sanitizeOriginalName(fileName),
        extension,
        mimeType,
        size,
        status: 'pending',
        purpose,
        storeId: storeId || null,
        userId: userId || null,
      },
    })

    const uploadUrl = await r2Storage.getPresignedUploadUrl(objectKey, mimeType)
    const publicUrl = await r2Storage.getFileUrl(objectKey)

    return {
      fileId: file.id,
      publicId: file.publicId,
      uploadUrl,
      publicUrl,
      objectKey,
      expiresInSeconds: 900, // 15 minutes
    }
  }

  /**
   * Direct multipart upload into Cloudflare R2
   */
  static async directUpload(params: DirectUploadParams) {
    const { fileName, mimeType, buffer, purpose, storeId, userId } = params
    const size = buffer.length

    if (size > MAX_FILE_SIZE_BYTES) {
      throw new AppError(
        'VALIDATION_ERROR',
        `O tamanho do arquivo excede o limite máximo permitido de 5 MB (${Math.round(size / 1024 / 1024)} MB enviado)`,
        400,
      )
    }

    if (!ALLOWED_MIME_TYPES[mimeType.toLowerCase()]) {
      throw new AppError(
        'VALIDATION_ERROR',
        `Formato de arquivo não suportado (${mimeType}). Formatos aceitos: JPEG, PNG, WebP. SVGs e scripts são desativados por segurança.`,
        400,
      )
    }

    const processedImage = await processImageUpload(buffer, mimeType)
    const uniqueId = randomUUID()
    const folder = PURPOSE_FOLDER_MAP[purpose] || 'uncategorized'
    const objectKey = `uploads/${folder}/${uniqueId}.${processedImage.extension}`
    const bucket = apiEnv.R2_BUCKET_NAME || 'verttex'

    const publicUrl = await r2Storage.uploadFile(
      objectKey,
      processedImage.buffer,
      processedImage.mimeType,
    )

    try {
      const file = await prisma.file.create({
        data: {
          provider: r2Storage.isConfigured ? 'cloudflare_r2' : 'local',
          bucket,
          objectKey,
          originalName: sanitizeOriginalName(fileName),
          extension: processedImage.extension,
          mimeType: processedImage.mimeType,
          size: processedImage.size,
          checksum: processedImage.checksum,
          width: processedImage.width,
          height: processedImage.height,
          status: 'approved',
          purpose,
          storeId: storeId || null,
          userId: userId || null,
        },
      })

      return {
        ...file,
        publicUrl,
      }
    } catch (error) {
      await r2Storage.deleteFile(objectKey).catch(() => undefined)
      throw error
    }
  }

  /**
   * Downloads, validates, sanitizes and approves a presigned upload.
   */
  static async finalizeUpload(fileId: string, userId?: string) {
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        deletedAt: null,
        ...(userId ? { userId } : {}),
      },
    })

    if (!file) {
      throw new AppError('NOT_FOUND', 'Registro de arquivo não encontrado', 404)
    }

    if (
      file.status === 'approved' &&
      file.checksum &&
      file.width &&
      file.height
    ) {
      return {
        ...file,
        publicUrl: await r2Storage.getFileUrl(file.objectKey),
      }
    }

    if (file.status === 'processing') {
      throw new AppError(
        'CONFLICT',
        'Este arquivo já está sendo processado',
        409,
      )
    }

    if (file.status === 'rejected') {
      throw new AppError(
        'VALIDATION_ERROR',
        'Este upload foi rejeitado e não pode ser finalizado novamente',
        400,
      )
    }

    const claimed = await prisma.file.updateMany({
      where: { id: fileId, status: 'pending' },
      data: { status: 'processing' },
    })

    if (claimed.count !== 1) {
      throw new AppError(
        'CONFLICT',
        'O estado do arquivo mudou durante a finalização',
        409,
      )
    }

    try {
      const uploadedBuffer = await r2Storage.downloadFile(file.objectKey)
      const processedImage = await processImageUpload(
        uploadedBuffer,
        file.mimeType,
      )

      await r2Storage.uploadFile(
        file.objectKey,
        processedImage.buffer,
        processedImage.mimeType,
      )

      const updatedFile = await prisma.file.update({
        where: { id: fileId },
        data: {
          checksum: processedImage.checksum,
          extension: processedImage.extension,
          height: processedImage.height,
          mimeType: processedImage.mimeType,
          size: processedImage.size,
          status: 'approved',
          width: processedImage.width,
        },
      })

      return {
        ...updatedFile,
        publicUrl: await r2Storage.getFileUrl(file.objectKey),
      }
    } catch (error) {
      await prisma.file
        .update({
          where: { id: fileId },
          data: { status: 'rejected' },
        })
        .catch(() => undefined)
      await r2Storage.deleteFile(file.objectKey).catch(() => undefined)

      if (error instanceof AppError) throw error
      throw new AppError(
        'VALIDATION_ERROR',
        'Não foi possível validar o conteúdo enviado ao armazenamento',
        400,
      )
    }
  }

  /**
   * Permanently deletes a file from Cloudflare R2 and PostgreSQL database
   */
  static async deleteFile(fileId: string) {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    })

    if (!file) return

    try {
      await r2Storage.deleteFile(file.objectKey)
    } catch (err) {
      console.error(
        `Erro ao apagar arquivo ${file.objectKey} no Cloudflare R2:`,
        err,
      )
    }

    await prisma.file
      .delete({
        where: { id: fileId },
      })
      .catch(() => null)
  }
}
