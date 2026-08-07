import sharp from 'sharp'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { prisma } from '../../infrastructure/database/prisma'
import { r2Storage } from '../../infrastructure/storage/r2'
import { UploadService } from '../../shared/services/upload.service'

const createdFileIds: string[] = []

describe('Files & UploadService', () => {
  afterEach(async () => {
    vi.restoreAllMocks()
    if (createdFileIds.length > 0) {
      await prisma.file.deleteMany({ where: { id: { in: createdFileIds } } })
      createdFileIds.length = 0
    }
  })

  it('should generate presigned upload metadata for allowed image mime types', async () => {
    const res = await UploadService.requestUpload({
      fileName: '../queijo\u0000-canastra.jpg',
      mimeType: 'image/jpeg',
      size: 1024 * 500, // 500 KB
      purpose: 'product_image',
    })

    expect(res).toBeDefined()
    createdFileIds.push(res.fileId)
    expect(res.fileId).toBeDefined()
    expect(res.objectKey).toContain('uploads/catalog/products/')
    expect(res.uploadUrl).toBeDefined()

    const storedFile = await prisma.file.findUniqueOrThrow({
      where: { id: res.fileId },
    })
    expect(storedFile.originalName).toBe('queijo-canastra.jpg')
  })

  it('should map specific upload purposes to dedicated canonical R2 directory paths', async () => {
    const faviconRes = await UploadService.requestUpload({
      fileName: 'favicon.ico',
      mimeType: 'image/png',
      size: 10 * 1024,
      purpose: 'marketplace_favicon',
    })
    createdFileIds.push(faviconRes.fileId)
    expect(faviconRes.objectKey).toContain('uploads/marketplace/favicons/')

    const logoRes = await UploadService.requestUpload({
      fileName: 'logo.png',
      mimeType: 'image/png',
      size: 50 * 1024,
      purpose: 'marketplace_logo',
    })
    createdFileIds.push(logoRes.fileId)
    expect(logoRes.objectKey).toContain('uploads/marketplace/logos/')
  })

  it('should reject upload requests for disallowed file formats (e.g. SVG / script)', async () => {
    await expect(
      UploadService.requestUpload({
        fileName: 'malicious.svg',
        mimeType: 'image/svg+xml',
        size: 1024,
        purpose: 'product_image',
      }),
    ).rejects.toThrow('Formato de arquivo não suportado')
  })

  it('should reject upload requests exceeding 5 MB file size limit', async () => {
    await expect(
      UploadService.requestUpload({
        fileName: 'huge.jpg',
        mimeType: 'image/jpeg',
        size: 10 * 1024 * 1024, // 10 MB
        purpose: 'product_image',
      }),
    ).rejects.toThrow('excede o limite máximo permitido de 5 MB')
  })

  it('should finalize pending upload and approve file status', async () => {
    const image = await sharp({
      create: {
        background: { alpha: 1, b: 120, g: 80, r: 30 },
        channels: 4,
        height: 10,
        width: 20,
      },
    })
      .png()
      .toBuffer()

    vi.spyOn(r2Storage, 'downloadFile').mockResolvedValue(image)
    vi.spyOn(r2Storage, 'uploadFile').mockResolvedValue(
      'https://cdn.example.test/doce.png',
    )

    const request = await UploadService.requestUpload({
      fileName: 'doce.png',
      mimeType: 'image/png',
      size: 200 * 1024,
      purpose: 'product_image',
    })
    createdFileIds.push(request.fileId)

    const finalized = await UploadService.finalizeUpload(request.fileId)

    expect(finalized.status).toBe('approved')
    expect(finalized.checksum).toMatch(/^[a-f0-9]{64}$/)
    expect(finalized.width).toBe(20)
    expect(finalized.height).toBe(10)
    expect(r2Storage.downloadFile).toHaveBeenCalledWith(request.objectKey)
    expect(r2Storage.uploadFile).toHaveBeenCalled()
  })
})
