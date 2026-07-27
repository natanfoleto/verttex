import { FastifyReply, FastifyRequest } from "fastify";
import { CartOwner, CartService } from "./cart.service";
import {
  AddItemToCartBody,
  ApplyCouponBody,
  SyncCartBody,
  UpdateCartItemQuantityBody,
} from "./cart.schemas";

function extractCartOwner(req: FastifyRequest): CartOwner {
  const customerId = (req as any).customerPayload?.id || (req as any).customer?.id;
  const sessionId = (req.headers["x-session-id"] as string) || (req.headers["x-cart-token"] as string) || "default-guest-session";

  return {
    customerId: customerId || undefined,
    sessionId: !customerId ? sessionId : undefined,
  };
}

export async function getCartController(req: FastifyRequest, reply: FastifyReply) {
  const owner = extractCartOwner(req);
  const summary = await CartService.getCartSummary(owner);
  return reply.status(200).send({
    success: true,
    data: summary,
  });
}

export async function addItemToCartController(
  req: FastifyRequest<{ Body: AddItemToCartBody }>,
  reply: FastifyReply,
) {
  const owner = extractCartOwner(req);
  const { variationId, quantity } = req.body;
  const summary = await CartService.addItem(owner, variationId, quantity);
  return reply.status(200).send({
    success: true,
    data: summary,
  });
}

export async function updateCartItemQuantityController(
  req: FastifyRequest<{ Params: { id: string }; Body: UpdateCartItemQuantityBody }>,
  reply: FastifyReply,
) {
  const owner = extractCartOwner(req);
  const { quantity } = req.body;
  const summary = await CartService.updateItemQuantity(owner, req.params.id, quantity);
  return reply.status(200).send({
    success: true,
    data: summary,
  });
}

export async function removeCartItemController(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const owner = extractCartOwner(req);
  const summary = await CartService.removeItem(owner, req.params.id);
  return reply.status(200).send({
    success: true,
    data: summary,
  });
}

export async function clearCartController(req: FastifyRequest, reply: FastifyReply) {
  const owner = extractCartOwner(req);
  const summary = await CartService.clearCart(owner);
  return reply.status(200).send({
    success: true,
    data: summary,
  });
}

export async function applyCouponController(
  req: FastifyRequest<{ Body: ApplyCouponBody }>,
  reply: FastifyReply,
) {
  const owner = extractCartOwner(req);
  const summary = await CartService.applyCoupon(owner, req.body.code);
  return reply.status(200).send({
    success: true,
    data: summary,
  });
}

export async function removeCouponController(
  req: FastifyRequest<{ Params: { code: string } }>,
  reply: FastifyReply,
) {
  const owner = extractCartOwner(req);
  const summary = await CartService.removeCoupon(owner, req.params.code);
  return reply.status(200).send({
    success: true,
    data: summary,
  });
}

export async function syncCartController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const customerId = (req as any).customerPayload?.id || (req as any).customer?.id;
  if (!customerId) {
    return reply.status(401).send({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Cliente não autenticado" },
    });
  }

  const { anonymousSessionId } = req.body as SyncCartBody;

  const summary = await CartService.syncAnonymousCartToCustomer(
    customerId,
    anonymousSessionId,
  );

  return reply.status(200).send({
    success: true,
    data: summary,
  });
}
