import { z } from 'zod'

export const createLotBodySchema = z.object({
  storeId: z.string().min(1, 'Loja vinculada é obrigatória'),
  productId: z.string().min(1, 'Produto é obrigatório'),
  variationId: z.string().optional().nullable(),
  lotNumber: z.string().min(1, 'Código do lote é obrigatório'),
  manufacturer: z.string().optional().nullable(),
  supplier: z.string().optional().nullable(),
  manufacturingDate: z.string().datetime().optional().nullable(),
  expirationDate: z.string().datetime().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export type CreateLotBody = z.infer<typeof createLotBodySchema>

export const updateLotStatusBodySchema = z.object({
  status: z.enum(['available', 'quarantine', 'blocked', 'recalled']),
  reason: z
    .string()
    .min(3, 'Justificativa da alteração de status é obrigatória'),
})

export type UpdateLotStatusBody = z.infer<typeof updateLotStatusBodySchema>

export const listLotsQuerySchema = z.object({
  storeId: z.string().optional(),
  productId: z.string().optional(),
  variationId: z.string().optional(),
  status: z
    .enum(['available', 'quarantine', 'blocked', 'recalled', 'all'])
    .optional()
    .default('all'),
  expirationCondition: z
    .enum(['all', 'valid', 'warning', 'insufficient', 'expired'])
    .optional()
    .default('all'),
  search: z.string().optional(),
  page: z
    .string()
    .transform((v) => parseInt(v, 10))
    .optional()
    .default('1'),
  limit: z
    .string()
    .transform((v) => parseInt(v, 10))
    .optional()
    .default('20'),
})

export type ListLotsQuery = z.infer<typeof listLotsQuerySchema>
