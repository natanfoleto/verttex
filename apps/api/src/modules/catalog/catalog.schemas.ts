import { z } from 'zod'

export const publicProductListQuerySchema = z
  .object({
    page: z.coerce.number().optional().default(1),
    perPage: z.coerce.number().optional().default(20),
    search: z.string().optional(),
    categorySlug: z.string().optional(),
    categoryId: z.string().optional(),
    brandSlug: z.string().optional(),
    brandId: z.string().optional(),
    storeSlug: z.string().optional(),
    storeId: z.string().optional(),
    minPrice: z.coerce.number().optional(),
    maxPrice: z.coerce.number().optional(),
    isFeatured: z
      .union([z.boolean(), z.string()])
      .transform((val) => val === true || val === 'true')
      .optional(),
    sort: z
      .string()
      .optional()
      .transform((val) => {
        if (!val || val === 'relevancia' || val === 'featured')
          return 'featured'
        if (val === 'menor-preco' || val === 'price_asc') return 'price_asc'
        if (val === 'maior-preco' || val === 'price_desc') return 'price_desc'
        if (val === 'mais-vendidos' || val === 'newest') return 'newest'
        return 'featured'
      })
      .default('featured'),
  })
  .strict()

export type PublicProductListQuery = z.infer<
  typeof publicProductListQuerySchema
>

export const publicStoreListQuerySchema = z
  .object({
    page: z.coerce.number().optional().default(1),
    perPage: z.coerce.number().optional().default(20),
    search: z.string().optional(),
  })
  .strict()

export type PublicStoreListQuery = z.infer<typeof publicStoreListQuerySchema>
