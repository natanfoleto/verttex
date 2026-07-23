import { z } from 'zod'

export const categoryQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  perPage: z.coerce.number().optional().default(20),
  search: z.string().optional(),
  parentId: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  isVisible: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
})

export type CategoryQuery = z.infer<typeof categoryQuerySchema>

export const createCategorySchema = z.object({
  name: z.string().min(2, 'O nome da categoria deve ter pelo menos 2 caracteres'),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  imageUrl: z.string().url('URL de imagem inválida').optional().nullable(),
  iconUrl: z.string().url('URL de ícone inválida').optional().nullable(),
  parentId: z.string().optional().nullable(),
  position: z.number().int().optional().default(0),
  status: z.enum(['active', 'inactive']).optional().default('active'),
  isVisible: z.boolean().optional().default(true),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
})

export type CreateCategoryBody = z.infer<typeof createCategorySchema>

export const updateCategorySchema = createCategorySchema.partial()

export type UpdateCategoryBody = z.infer<typeof updateCategorySchema>

export const reorderCategoriesSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      position: z.number().int().min(0),
    })
  ),
})

export type ReorderCategoriesBody = z.infer<typeof reorderCategoriesSchema>
