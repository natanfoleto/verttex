import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  listUserNotificationsController,
  markAsReadController,
  checkLotExpirationsController,
} from "./notifications.controller";
import { listNotificationsQuerySchema, expirationCheckSchema } from "./notifications.schemas";

export async function notificationsRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // GET /notifications — Protected for authenticated users/customers
  typedApp.get(
    "/",
    {
      schema: {
        tags: ["Notifications"],
        summary: "Listar notificações do usuário",
        querystring: listNotificationsQuerySchema,
      },
    },
    listUserNotificationsController,
  );

  // PATCH /notifications/:id/read — Protected
  typedApp.patch(
    "/:id/read",
    {
      schema: {
        tags: ["Notifications"],
        summary: "Marcar notificação como lida",
        params: z.object({ id: z.string() }),
      },
    },
    markAsReadController,
  );

  // POST /notifications/expiration-check — Protected for Management Users
  typedApp.post(
    "/expiration-check",
    {
      schema: {
        tags: ["Notifications"],
        summary: "Executar checagem sanitária de vencimento de lotes por faixas de dias",
        body: expirationCheckSchema,
      },
    },
    checkLotExpirationsController,
  );
}
