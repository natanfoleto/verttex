import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  adjustStockController,
  discardExpiredStockController,
  queryCommercialAvailabilityController,
  receiveStockController,
  transferStockController,
} from "./stock.controller";
import {
  adjustStockBodySchema,
  discardExpiredStockBodySchema,
  queryAvailabilityQuerySchema,
  receiveStockBodySchema,
  transferStockBodySchema,
} from "./stock.schemas";

export async function stockRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.post(
    "/receive",
    {
      preHandler: [app.authenticateUser],
      schema: {
        tags: ["Stock — Inventory & FEFO Management"],
        summary:
          "Recebimento de mercadorias com registro por lote e localização",
        security: [{ bearerAuth: [] }],
        body: receiveStockBodySchema,
      },
    },
    receiveStockController,
  );

  typedApp.get(
    "/availability",
    {
      schema: {
        tags: ["Stock — Inventory & FEFO Management"],
        summary: "Consulta unificada de disponibilidade comercial via FEFO",
        querystring: queryAvailabilityQuerySchema,
      },
    },
    queryCommercialAvailabilityController,
  );

  typedApp.post(
    "/adjust",
    {
      preHandler: [app.authenticateUser],
      schema: {
        tags: ["Stock — Inventory & FEFO Management"],
        summary: "Ajuste manual de inventário físico por lote e localização",
        security: [{ bearerAuth: [] }],
        body: adjustStockBodySchema,
      },
    },
    adjustStockController,
  );

  typedApp.post(
    "/discard",
    {
      preHandler: [app.authenticateUser],
      schema: {
        tags: ["Stock — Inventory & FEFO Management"],
        summary:
          "Descarte formal por vencimento ou dano com justificativa e destino",
        security: [{ bearerAuth: [] }],
        body: discardExpiredStockBodySchema,
      },
    },
    discardExpiredStockController,
  );

  typedApp.post(
    "/transfer",
    {
      preHandler: [app.authenticateUser],
      schema: {
        tags: ["Stock — Inventory & FEFO Management"],
        summary: "Transferência de lote entre localizações físicas de estoque",
        security: [{ bearerAuth: [] }],
        body: transferStockBodySchema,
      },
    },
    transferStockController,
  );
}
