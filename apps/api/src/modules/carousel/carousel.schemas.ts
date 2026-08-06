import { z } from 'zod'

// Helper validator to prevent dangerous protocols like javascript:
const safeUrlSchema = z
  .string()
  .refine(
    (val) => {
      if (!val) return true
      const lower = val.trim().toLowerCase()
      if (
        lower.startsWith('javascript:') ||
        lower.startsWith('data:') ||
        lower.startsWith('vbscript:')
      ) {
        return false
      }
      return true
    },
    { message: 'URL inválida ou contendo protocolo não permitido.' },
  )
  .optional()
  .nullable()

export const createCarouselBannerSchema = z
  .object({
    title: z.string().min(1, 'Título é obrigatório').max(150),
    subtitle: z.string().max(300).optional().nullable(),
    linkUrl: safeUrlSchema,
    ctaText: z.string().max(60).optional().nullable(),
    position: z.number().int().min(0).optional(),
    isActive: z.boolean().default(true),
  })
  .strict()

export const updateCarouselBannerSchema = z
  .object({
    title: z.string().min(1).max(150).optional(),
    subtitle: z.string().max(300).nullable().optional(),
    linkUrl: safeUrlSchema,
    ctaText: z.string().max(60).nullable().optional(),
    fileId: z.string().nullable().optional(),
    imageUrl: safeUrlSchema,
    position: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  })
  .strict()

export const reorderCarouselBannersSchema = z
  .object({
    items: z.array(
      z.object({
        id: z.string().min(1),
        position: z.number().int().min(0),
      }),
    ),
  })
  .strict()

export type CreateCarouselBannerInput = z.infer<
  typeof createCarouselBannerSchema
>
export type UpdateCarouselBannerInput = z.infer<
  typeof updateCarouselBannerSchema
>
