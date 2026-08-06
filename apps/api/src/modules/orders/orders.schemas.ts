import { z } from 'zod'

export const checkoutBodySchema = z
  .object({
    customerAddressId: z.string().min(1, 'Endereço de entrega é obrigatório'),
    paymentMethod: z.enum(['pix', 'credit_card', 'boleto']).default('pix'),
    notes: z
      .string()
      .max(500, 'Observações devem ter no máximo 500 caracteres')
      .optional(),
  })
  .strict()

export type CheckoutBodyInput = z.infer<typeof checkoutBodySchema>

export const cancelOrderBodySchema = z
  .object({
    cancelReason: z
      .string()
      .min(3, 'Motivo de cancelamento deve ter pelo menos 3 caracteres')
      .optional(),
  })
  .strict()

export type CancelOrderBodyInput = z.infer<typeof cancelOrderBodySchema>

export const listOrdersQuerySchema = z
  .object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(10),
    status: z
      .enum(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
      .optional(),
  })
  .strict()

export type ListOrdersQueryInput = z.infer<typeof listOrdersQuerySchema>
