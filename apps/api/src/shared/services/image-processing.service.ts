import { createHash } from 'node:crypto'

import sharp, { type Metadata } from 'sharp'

import { AppError } from '../errors/app-error'

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const MAX_IMAGE_PIXELS = 25_000_000

const IMAGE_FORMATS = {
  jpeg: { extension: 'jpg', mimeType: 'image/jpeg' },
  png: { extension: 'png', mimeType: 'image/png' },
  webp: { extension: 'webp', mimeType: 'image/webp' },
} as const

type SupportedImageFormat = keyof typeof IMAGE_FORMATS

export interface ProcessedImage {
  buffer: Buffer
  checksum: string
  extension: string
  height: number
  mimeType: string
  size: number
  width: number
}

function invalidImage(message: string): AppError {
  return new AppError('VALIDATION_ERROR', message, 400)
}

export async function processImageUpload(
  input: Buffer,
  declaredMimeType: string,
): Promise<ProcessedImage> {
  if (input.length === 0) {
    throw invalidImage('O arquivo de imagem está vazio')
  }

  if (input.length > MAX_FILE_SIZE_BYTES) {
    throw invalidImage('O arquivo deve ter no máximo 5 MB')
  }

  let metadata: Metadata
  try {
    metadata = await sharp(input, {
      failOn: 'error',
      limitInputPixels: MAX_IMAGE_PIXELS,
    }).metadata()
  } catch {
    throw invalidImage(
      'O conteúdo enviado não é uma imagem JPEG, PNG ou WebP válida',
    )
  }

  const format = metadata.format as SupportedImageFormat | undefined
  if (!format || !(format in IMAGE_FORMATS)) {
    throw invalidImage('Formato real do arquivo não suportado')
  }

  const expected = IMAGE_FORMATS[format]
  if (declaredMimeType.toLowerCase() !== expected.mimeType) {
    throw invalidImage(
      `O conteúdo do arquivo não corresponde ao MIME declarado (${declaredMimeType})`,
    )
  }

  if (!metadata.width || !metadata.height) {
    throw invalidImage('Não foi possível determinar as dimensões da imagem')
  }

  if (metadata.width * metadata.height > MAX_IMAGE_PIXELS) {
    throw invalidImage('A imagem excede o limite de 25 megapixels')
  }

  if ((metadata.pages ?? 1) > 1) {
    throw invalidImage(
      'Imagens animadas ou com múltiplas páginas não são aceitas',
    )
  }

  let pipeline = sharp(input, {
    failOn: 'error',
    limitInputPixels: MAX_IMAGE_PIXELS,
  }).rotate()

  if (format === 'jpeg') {
    pipeline = pipeline.jpeg({ mozjpeg: true, quality: 90 })
  } else if (format === 'png') {
    pipeline = pipeline.png({ compressionLevel: 9 })
  } else {
    pipeline = pipeline.webp({ quality: 90 })
  }

  let processed: Buffer
  let info: { height: number; size: number; width: number }
  try {
    const result = await pipeline.toBuffer({ resolveWithObject: true })
    processed = result.data
    info = result.info
  } catch {
    throw invalidImage('Não foi possível processar a imagem enviada')
  }

  if (processed.length > MAX_FILE_SIZE_BYTES) {
    throw invalidImage('A imagem processada excede o limite de 5 MB')
  }

  return {
    buffer: processed,
    checksum: createHash('sha256').update(processed).digest('hex'),
    extension: expected.extension,
    height: info.height,
    mimeType: expected.mimeType,
    size: info.size,
    width: info.width,
  }
}
