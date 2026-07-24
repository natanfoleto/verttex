import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { requirePermission } from "../../shared/middlewares/require-permission";
import { brandsController } from "./brands.controller";
import {
  brandQuerySchema,
  createBrandSchema,
  updateBrandSchema,
} from "./brands.schemas";

const idParamsSchema = z.object({
  id: z.string().min(1),
});

export async function brandsRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // Public / General Read Routes
  typedApp.get(
    "/",
    {
      schema: {
        querystring: brandQuerySchema,
      },
    },
    brandsController.list,
  );

  typedApp.get(
    "/:id",
    {
      schema: {
        params: idParamsSchema,
      },
    },
    brandsController.getById,
  );

  // Protected Routes (Management users)
  typedApp.post(
    "/",
    {
      preHandler: [app.authenticateUser, requirePermission("create", "Brand")],
      schema: {
        body: createBrandSchema,
      },
    },
    brandsController.create,
  );

  typedApp.patch(
    "/:id",
    {
      preHandler: [app.authenticateUser, requirePermission("update", "Brand")],
      schema: {
        params: idParamsSchema,
        body: updateBrandSchema,
      },
    },
    brandsController.update,
  );

  typedApp.delete(
    "/:id",
    {
      preHandler: [app.authenticateUser, requirePermission("delete", "Brand")],
      schema: {
        params: idParamsSchema,
      },
    },
    brandsController.delete,
  );
}
