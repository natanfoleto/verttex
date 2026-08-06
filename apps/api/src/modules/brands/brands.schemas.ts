import { z } from 'zod'

export const brandQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  perPage: z.coerce.number().optional().default(20),
  search: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  isVisible: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
})

export type BrandQuery = z.infer<typeof brandQuerySchema>

export const createBrandSchema = z.object({
  name: z.string().min(2, 'O nome da marca deve ter pelo menos 2 caracteres'),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  logoUrl: z.string().url('URL do logotipo inválida').optional().nullable(),
  status: z.enum(['active', 'inactive']).optional().default('active'),
  isVisible: z.boolean().optional().default(true),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
})

export type CreateBrandBody = z.infer<typeof createBrandSchema>

export const updateBrandSchema = createBrandSchema.partial()

export type UpdateBrandBody = z.infer<typeof updateBrandSchema>
