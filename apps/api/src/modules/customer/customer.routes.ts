import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  getCustomerProfileController,
  updateCustomerProfileController,
} from "../auth-customers/auth-customers.controller";
import { updateCustomerProfileBodySchema } from "../auth-customers/auth-customers.schemas";

export async function customerRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.get(
    "/profile",
    {
      preHandler: [app.authenticateCustomer],
      schema: {
        tags: ["Customer Profile"],
        summary: "Consultar perfil do cliente autenticado",
        security: [{ bearerAuth: [] }],
      },
    },
    getCustomerProfileController,
  );

  typedApp.patch(
    "/profile",
    {
      preHandler: [app.authenticateCustomer],
      schema: {
        tags: ["Customer Profile"],
        summary: "Atualizar perfil do cliente autenticado",
        security: [{ bearerAuth: [] }],
        body: updateCustomerProfileBodySchema,
      },
    },
    updateCustomerProfileController,
  );
}
