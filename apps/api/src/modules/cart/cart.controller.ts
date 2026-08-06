import { FastifyReply, FastifyRequest } from 'fastify'

import {
  AddItemToCartBody,
  ApplyCouponBody,
  SyncCartBody,
  UpdateCartItemQuantityBody,
} from './cart.schemas'
import { CartOwner, CartService } from './cart.service'

function extractCartOwner(req: FastifyRequest): CartOwner {
  const customerId = req.customerPayload?.id || req.customer?.id
  const sessionId =
    (req.headers['x-session-id'] as string) ||
    (req.headers['x-cart-token'] as string) ||
    'default-guest-session'

  return {
    customerId: customerId || undefined,
    sessionId: !customerId ? sessionId : undefined,
  }
}

export async function getCartController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const owner = extractCartOwner(req)
  const summary = await CartService.getCartSummary(owner)
  return reply.status(200).send({
    success: true,
    data: summary,
  })
}

export async function addItemToCartController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const owner = extractCartOwner(req)
  const { variationId, quantity } = req.body as AddItemToCartBody
  const summary = await CartService.addItem(owner, variationId, quantity)
  return reply.status(200).send({
    success: true,
    data: summary,
  })
}

export async function updateCartItemQuantityController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const owner = extractCartOwner(req)
  const { quantity } = req.body as UpdateCartItemQuantityBody
  const params = req.params as { id: string }
  const summary = await CartService.updateItemQuantity(
    owner,
    params.id,
    quantity,
  )
  return reply.status(200).send({
    success: true,
    data: summary,
  })
}

export async function removeCartItemController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const owner = extractCartOwner(req)
  const params = req.params as { id: string }
  const summary = await CartService.removeItem(owner, params.id)
  return reply.status(200).send({
    success: true,
    data: summary,
  })
}

export async function clearCartController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const owner = extractCartOwner(req)
  const summary = await CartService.clearCart(owner)
  return reply.status(200).send({
    success: true,
    data: summary,
  })
}

export async function applyCouponController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const owner = extractCartOwner(req)
  const body = req.body as ApplyCouponBody
  const summary = await CartService.applyCoupon(owner, body.code)
  return reply.status(200).send({
    success: true,
    data: summary,
  })
}

export async function removeCouponController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const owner = extractCartOwner(req)
  const params = req.params as { code: string }
  const summary = await CartService.removeCoupon(owner, params.code)
  return reply.status(200).send({
    success: true,
    data: summary,
  })
}

export async function syncCartController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const customerId = req.customerPayload?.id || req.customer?.id
  if (!customerId) {
    return reply.status(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Cliente não autenticado' },
    })
  }

  const { anonymousSessionId } = req.body as SyncCartBody

  const summary = await CartService.syncAnonymousCartToCustomer(
    customerId,
    anonymousSessionId,
  )

  return reply.status(200).send({
    success: true,
    data: summary,
  })
}
