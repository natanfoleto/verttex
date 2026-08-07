import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

import { processImageUpload } from './image-processing.service'

describe('ImageProcessingService', () => {
  it('decodes, normalizes and fingerprints a valid image', async () => {
    const input = await sharp({
      create: {
        background: { alpha: 1, b: 40, g: 120, r: 20 },
        channels: 4,
        height: 12,
        width: 16,
      },
    })
      .png()
      .withMetadata({ orientation: 1 })
      .toBuffer()

    const result = await processImageUpload(input, 'image/png')
    const outputMetadata = await sharp(result.buffer).metadata()

    expect(result.mimeType).toBe('image/png')
    expect(result.extension).toBe('png')
    expect(result.width).toBe(16)
    expect(result.height).toBe(12)
    expect(result.checksum).toMatch(/^[a-f0-9]{64}$/)
    expect(outputMetadata.orientation).toBeUndefined()
  })

  it('rejects arbitrary bytes even when the declared MIME is allowed', async () => {
    await expect(
      processImageUpload(Buffer.from('<script>alert(1)</script>'), 'image/png'),
    ).rejects.toThrow('não é uma imagem JPEG, PNG ou WebP válida')
  })

  it('rejects a valid image whose real format differs from the declared MIME', async () => {
    const jpeg = await sharp({
      create: {
        background: { b: 0, g: 0, r: 255 },
        channels: 3,
        height: 4,
        width: 4,
      },
    })
      .jpeg()
      .toBuffer()

    await expect(processImageUpload(jpeg, 'image/png')).rejects.toThrow(
      'não corresponde ao MIME declarado',
    )
  })
})
