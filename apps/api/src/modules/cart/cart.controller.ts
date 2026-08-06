import { FastifyReply, FastifyRequest } from 'fastify'

import { PersonalizationIdentityService } from '../customer/personalization-identity.service'
import {
  AddItemToCartBody,
  ApplyCouponBody,
  SyncCartBody,
  UpdateCartItemQuantityBody,
} from './cart.schemas'
import { CartOwner, CartService } from './cart.service'

export async function extractCartOwner(
  req: FastifyRequest,
  reply?: FastifyReply,
): Promise<CartOwner> {
  const customerId = req.customerPayload?.id || req.customer?.id
  if (customerId) {
    return { customerId }
  }

  const { profile } =
    await PersonalizationIdentityService.resolveProfileFromRequest(req, reply)
  return { sessionId: profile.id }
}

export async function getCartController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const owner = await extractCartOwner(req, reply)
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
  const owner = await extractCartOwner(req, reply)
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
  const owner = await extractCartOwner(req, reply)
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
  const owner = await extractCartOwner(req, reply)
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
  const owner = await extractCartOwner(req, reply)
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
  const owner = await extractCartOwner(req, reply)
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
  const owner = await extractCartOwner(req, reply)
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
