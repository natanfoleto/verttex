import { z } from 'zod'

export const requestUploadBodySchema = z
  .object({
    fileName: z
      .string()
      .trim()
      .min(1, 'Nome do arquivo é obrigatório')
      .max(255, 'Nome do arquivo excede o limite de 255 caracteres'),
    mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
    size: z
      .number()
      .int()
      .positive('Tamanho do arquivo deve ser positivo')
      .max(5 * 1024 * 1024, 'O arquivo deve ter no máximo 5 MB'),
    purpose: z
      .enum([
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
      ])
      .default('product_image'),
    storeId: z.string().min(1).optional().nullable(),
  })
  .strict()

export type RequestUploadBody = z.infer<typeof requestUploadBodySchema>

export const finalizeUploadParamsSchema = z
  .object({
    fileId: z.string().min(1, 'ID do arquivo é obrigatório'),
  })
  .strict()

export type FinalizeUploadParams = z.infer<typeof finalizeUploadParamsSchema>
