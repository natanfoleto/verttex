import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { requirePermission } from "../../shared/middlewares/require-permission";
import { marketplaceController } from "./marketplace.controller";
import { updateMarketplaceSettingsSchema } from "./marketplace.schemas";

export async function marketplaceRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // Obter configurações (Admin)
  typedApp.get(
    "/settings",
    {
      preHandler: [
        app.authenticateUser,
        requirePermission("read", "Marketplace"),
      ],
    },
    marketplaceController.getSettings
  );

  // Atualizar configurações (Admin)
  typedApp.put(
    "/settings",
    {
      preHandler: [
        app.authenticateUser,
        requirePermission("update", "Marketplace"),
      ],
      schema: { body: updateMarketplaceSettingsSchema },
    },
    marketplaceController.updateSettings
  );
}

export async function marketplacePublicRoutes(app: FastifyInstance) {
  // Configurações públicas do Marketplace
  app.get("/settings", marketplaceController.getPublicSettings);
}
