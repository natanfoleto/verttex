import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  quoteShippingController,
  dispatchOrderController,
  updateTrackingController,
  markAsDeliveredController,
} from "./shipping.controller";
import {
  quoteShippingSchema,
  dispatchOrderSchema,
  updateTrackingSchema,
} from "./shipping.schemas";

export async function shippingRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // POST /shipping/quote — Public endpoint to quote shipping options
  typedApp.post(
    "/quote",
    {
      schema: {
        tags: ["Shipping & Tracking"],
        summary: "Calcular opções e prazos de frete",
        body: quoteShippingSchema,
      },
    },
    quoteShippingController,
  );

  // POST /shipping/orders/:orderId/dispatch — Protected for Management Users
  typedApp.post(
    "/orders/:orderId/dispatch",
    {
      preHandler: [app.authenticateUser],
      schema: {
        tags: ["Shipping & Tracking"],
        summary: "Expedir pedido e registrar movimento de saída (DISPATCH)",
        security: [{ bearerAuth: [] }],
        params: z.object({ orderId: z.string() }),
        body: dispatchOrderSchema,
      },
    },
    dispatchOrderController,
  );

  // POST /shipping/orders/:orderId/tracking — Protected for Management Users
  typedApp.post(
    "/orders/:orderId/tracking",
    {
      preHandler: [app.authenticateUser],
      schema: {
        tags: ["Shipping & Tracking"],
        summary: "Atualizar eventos e localização de rastreamento do pedido",
        security: [{ bearerAuth: [] }],
        params: z.object({ orderId: z.string() }),
        body: updateTrackingSchema,
      },
    },
    updateTrackingController,
  );

  // POST /shipping/orders/:orderId/deliver — Protected for Management Users
  typedApp.post(
    "/orders/:orderId/deliver",
    {
      preHandler: [app.authenticateUser],
      schema: {
        tags: ["Shipping & Tracking"],
        summary: "Confirmar entrega do pedido ao comprador (DELIVERED)",
        security: [{ bearerAuth: [] }],
        params: z.object({ orderId: z.string() }),
      },
    },
    markAsDeliveredController,
  );
}
