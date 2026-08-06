import { z } from 'zod'

export const addItemToCartBodySchema = z
  .object({
    variationId: z.string().min(1, 'ID da variação é obrigatório'),
    quantity: z.number().int().min(1, 'Quantidade deve ser de no mínimo 1'),
  })
  .strict()

export type AddItemToCartBody = z.infer<typeof addItemToCartBodySchema>

export const updateCartItemQuantityBodySchema = z
  .object({
    quantity: z.number().int().min(1, 'Quantidade deve ser de no mínimo 1'),
  })
  .strict()

export type UpdateCartItemQuantityBody = z.infer<
  typeof updateCartItemQuantityBodySchema
>

export const applyCouponBodySchema = z
  .object({
    code: z
      .string()
      .min(1, 'Código do cupom é obrigatório')
      .transform((val) => val.trim().toUpperCase()),
  })
  .strict()

export type ApplyCouponBody = z.infer<typeof applyCouponBodySchema>
