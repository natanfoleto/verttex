import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import {
  addItemToCartController,
  applyCouponController,
  clearCartController,
  getCartController,
  removeCartItemController,
  removeCouponController,
  updateCartItemQuantityController,
} from './cart.controller'
import {
  addItemToCartBodySchema,
  applyCouponBodySchema,
  updateCartItemQuantityBodySchema,
} from './cart.schemas'

export async function cartRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>()

  // Classified optional customer auth hook (Requirement 3)
  const optionalAuth = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await app.authenticateCustomer(req, reply)
    } catch (err) {
      // 1. If explicit Authorization header (Bearer) was sent and failed -> throw 401
      if (req.headers.authorization) {
        throw err
      }

      // 2. If customer_access_token cookie was sent but is invalid/expired -> clear cookie and continue as visitor
      if (req.cookies.customer_access_token) {
        reply.clearCookie('customer_access_token', { path: '/' })
      }

      // 3. Absence of credentials or cleared cookie -> continue as visitor
    }
  }

  typedApp.get(
    '/',
    {
      preHandler: [optionalAuth],
      schema: {
        tags: ['Cart'],
        summary: 'Obter carrinho de compras ativo agrupado por loja vendedora',
      },
    },
    getCartController,
  )

  typedApp.post(
    '/items',
    {
      preHandler: [optionalAuth],
      schema: {
        tags: ['Cart'],
        summary: 'Adicionar item ao carrinho com validação de estoque/FEFO',
        body: addItemToCartBodySchema,
      },
    },
    addItemToCartController,
  )

  typedApp.patch(
    '/items/:id',
    {
      preHandler: [optionalAuth],
      schema: {
        tags: ['Cart'],
        summary: 'Atualizar quantidade de um item no carrinho',
        params: z.object({ id: z.string() }),
        body: updateCartItemQuantityBodySchema,
      },
    },
    updateCartItemQuantityController,
  )

  typedApp.delete(
    '/items/:id',
    {
      preHandler: [optionalAuth],
      schema: {
        tags: ['Cart'],
        summary: 'Remover um item do carrinho',
        params: z.object({ id: z.string() }),
      },
    },
    removeCartItemController,
  )

  typedApp.delete(
    '/',
    {
      preHandler: [optionalAuth],
      schema: {
        tags: ['Cart'],
        summary: 'Limpar todos os itens do carrinho',
      },
    },
    clearCartController,
  )

  typedApp.post(
    '/coupon',
    {
      preHandler: [optionalAuth],
      schema: {
        tags: ['Cart Coupons'],
        summary: 'Aplicar cupom de desconto ao carrinho',
        body: applyCouponBodySchema,
      },
    },
    applyCouponController,
  )

  typedApp.delete(
    '/coupon/:code',
    {
      preHandler: [optionalAuth],
      schema: {
        tags: ['Cart Coupons'],
        summary: 'Remover cupom de desconto do carrinho',
        params: z.object({ code: z.string() }),
      },
    },
    removeCouponController,
  )
}
