import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { requirePermission } from "../../shared/middlewares/require-permission";
import { requireStoreAccess } from "../../shared/middlewares/require-store-access";
import {
  createStoreController,
  listStoresController,
  getStoreController,
  updateStoreController,
  deleteStoreController,
  listStoreMembersController,
  addStoreMemberController,
  removeStoreMemberController,
} from "./stores.controller";
import {
  storeParamsSchema,
  storeQuerySchema,
  createStoreBodySchema,
  updateStoreBodySchema,
  addStoreMemberBodySchema,
  storeMemberParamsSchema,
} from "./stores.schemas";

export async function storesRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.get(
    "/stores",
    {
      preHandler: [app.authenticateUser, requirePermission("read", "Store")],
      schema: {
        tags: ["Stores Management"],
        summary: "Listar lojas parceiras (escopadas por permissão e vinculo)",
        security: [{ bearerAuth: [] }],
        querystring: storeQuerySchema,
      },
    },
    listStoresController,
  );

  typedApp.post(
    "/stores",
    {
      preHandler: [app.authenticateUser, requirePermission("create", "Store")],
      schema: {
        tags: ["Stores Management"],
        summary: "Criar nova loja parceira",
        security: [{ bearerAuth: [] }],
        body: createStoreBodySchema,
      },
    },
    createStoreController,
  );

  typedApp.get(
    "/stores/:storeId",
    {
      preHandler: [
        app.authenticateUser,
        requirePermission("read", "Store"),
        requireStoreAccess("storeId"),
      ],
      schema: {
        tags: ["Stores Management"],
        summary: "Consultar detalhes de uma loja parceira",
        security: [{ bearerAuth: [] }],
        params: storeParamsSchema,
      },
    },
    getStoreController,
  );

  typedApp.patch(
    "/stores/:storeId",
    {
      preHandler: [
        app.authenticateUser,
        requirePermission("update", "Store"),
        requireStoreAccess("storeId"),
      ],
      schema: {
        tags: ["Stores Management"],
        summary: "Atualizar dados de uma loja parceira",
        security: [{ bearerAuth: [] }],
        params: storeParamsSchema,
        body: updateStoreBodySchema,
      },
    },
    updateStoreController,
  );

  typedApp.delete(
    "/stores/:storeId",
    {
      preHandler: [
        app.authenticateUser,
        requirePermission("delete", "Store"),
        requireStoreAccess("storeId"),
      ],
      schema: {
        tags: ["Stores Management"],
        summary: "Desativar uma loja parceira (soft delete)",
        security: [{ bearerAuth: [] }],
        params: storeParamsSchema,
      },
    },
    deleteStoreController,
  );

  typedApp.get(
    "/stores/:storeId/users",
    {
      preHandler: [
        app.authenticateUser,
        requirePermission("manage-members", "Store"),
        requireStoreAccess("storeId"),
      ],
      schema: {
        tags: ["Stores Management"],
        summary: "Listar usuários/membros vinculados a uma loja",
        security: [{ bearerAuth: [] }],
        params: storeParamsSchema,
      },
    },
    listStoreMembersController,
  );

  typedApp.post(
    "/stores/:storeId/users",
    {
      preHandler: [
        app.authenticateUser,
        requirePermission("manage-members", "Store"),
        requireStoreAccess("storeId"),
      ],
      schema: {
        tags: ["Stores Management"],
        summary: "Vincular um usuário/membro a uma loja",
        security: [{ bearerAuth: [] }],
        params: storeParamsSchema,
        body: addStoreMemberBodySchema,
      },
    },
    addStoreMemberController,
  );

  typedApp.delete(
    "/stores/:storeId/users/:userId",
    {
      preHandler: [
        app.authenticateUser,
        requirePermission("manage-members", "Store"),
        requireStoreAccess("storeId"),
      ],
      schema: {
        tags: ["Stores Management"],
        summary: "Desvincular um usuário/membro de uma loja",
        security: [{ bearerAuth: [] }],
        params: storeMemberParamsSchema,
      },
    },
    removeStoreMemberController,
  );
}
