import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  addItemToCartController,
  applyCouponController,
  clearCartController,
  getCartController,
  removeCartItemController,
  removeCouponController,
  syncCartController,
  updateCartItemQuantityController,
} from "./cart.controller";
import {
  addItemToCartBodySchema,
  applyCouponBodySchema,
  syncCartBodySchema,
  updateCartItemQuantityBodySchema,
} from "./cart.schemas";

export async function cartRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // Optional customer auth hook (does not reject anonymous requests)
  const optionalAuth = async (req: any, reply: any) => {
    try {
      await app.authenticateCustomer(req, reply);
    } catch {
      // Continue as guest
    }
  };

  typedApp.get(
    "/",
    {
      preHandler: [optionalAuth],
      schema: {
        tags: ["Cart"],
        summary: "Obter carrinho de compras ativo agrupado por loja vendedora",
      },
    },
    getCartController,
  );

  typedApp.post(
    "/items",
    {
      preHandler: [optionalAuth],
      schema: {
        tags: ["Cart"],
        summary: "Adicionar item ao carrinho com validação de estoque/FEFO",
        body: addItemToCartBodySchema,
      },
    },
    addItemToCartController,
  );

  typedApp.patch(
    "/items/:id",
    {
      preHandler: [optionalAuth],
      schema: {
        tags: ["Cart"],
        summary: "Atualizar quantidade de um item no carrinho",
        params: z.object({ id: z.string() }),
        body: updateCartItemQuantityBodySchema,
      },
    },
    updateCartItemQuantityController,
  );

  typedApp.delete(
    "/items/:id",
    {
      preHandler: [optionalAuth],
      schema: {
        tags: ["Cart"],
        summary: "Remover um item do carrinho",
        params: z.object({ id: z.string() }),
      },
    },
    removeCartItemController,
  );

  typedApp.delete(
    "/",
    {
      preHandler: [optionalAuth],
      schema: {
        tags: ["Cart"],
        summary: "Limpar todos os itens do carrinho",
      },
    },
    clearCartController,
  );

  typedApp.post(
    "/coupon",
    {
      preHandler: [optionalAuth],
      schema: {
        tags: ["Cart Coupons"],
        summary: "Aplicar cupom de desconto ao carrinho",
        body: applyCouponBodySchema,
      },
    },
    applyCouponController,
  );

  typedApp.delete(
    "/coupon/:code",
    {
      preHandler: [optionalAuth],
      schema: {
        tags: ["Cart Coupons"],
        summary: "Remover cupom de desconto do carrinho",
        params: z.object({ code: z.string() }),
      },
    },
    removeCouponController,
  );

  typedApp.post(
    "/sync",
    {
      preHandler: [app.authenticateCustomer],
      schema: {
        tags: ["Cart"],
        summary: "Sincronizar/mesclar carrinho anônimo para a conta do cliente ao realizar login",
        security: [{ bearerAuth: [] }],
        body: syncCartBodySchema,
      },
    },
    syncCartController,
  );
}
