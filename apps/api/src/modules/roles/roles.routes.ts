import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { requirePermission } from "../../shared/middlewares/require-permission";
import {
  listRolesController,
  createRoleController,
  getRoleController,
  updateRoleController,
  deleteRoleController,
  getRolePermissionsController,
  updateRolePermissionsController,
} from "./roles.controller";
import {
  roleParamsSchema,
  createRoleBodySchema,
  updateRoleBodySchema,
  updateRolePermissionsBodySchema,
} from "./roles.schemas";

export async function rolesRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.get(
    "/roles",
    {
      preHandler: [app.authenticateUser, requirePermission("read", "Role")],
      schema: {
        tags: ["Roles & Permissions"],
        summary: "Listar cargos do sistema",
        security: [{ bearerAuth: [] }],
      },
    },
    listRolesController,
  );

  typedApp.post(
    "/roles",
    {
      preHandler: [app.authenticateUser, requirePermission("create", "Role")],
      schema: {
        tags: ["Roles & Permissions"],
        summary: "Criar novo cargo",
        security: [{ bearerAuth: [] }],
        body: createRoleBodySchema,
      },
    },
    createRoleController,
  );

  typedApp.get(
    "/roles/:roleId",
    {
      preHandler: [app.authenticateUser, requirePermission("read", "Role")],
      schema: {
        tags: ["Roles & Permissions"],
        summary: "Consultar detalhes de um cargo",
        security: [{ bearerAuth: [] }],
        params: roleParamsSchema,
      },
    },
    getRoleController,
  );

  typedApp.patch(
    "/roles/:roleId",
    {
      preHandler: [app.authenticateUser, requirePermission("update", "Role")],
      schema: {
        tags: ["Roles & Permissions"],
        summary: "Atualizar dados de um cargo",
        security: [{ bearerAuth: [] }],
        params: roleParamsSchema,
        body: updateRoleBodySchema,
      },
    },
    updateRoleController,
  );

  typedApp.delete(
    "/roles/:roleId",
    {
      preHandler: [app.authenticateUser, requirePermission("delete", "Role")],
      schema: {
        tags: ["Roles & Permissions"],
        summary: "Excluir um cargo (somente cargos não-sistema)",
        security: [{ bearerAuth: [] }],
        params: roleParamsSchema,
      },
    },
    deleteRoleController,
  );

  typedApp.get(
    "/roles/:roleId/permissions",
    {
      preHandler: [
        app.authenticateUser,
        requirePermission("read", "Permission"),
      ],
      schema: {
        tags: ["Roles & Permissions"],
        summary: "Listar permissões atribuídas a um cargo",
        security: [{ bearerAuth: [] }],
        params: roleParamsSchema,
      },
    },
    getRolePermissionsController,
  );

  typedApp.put(
    "/roles/:roleId/permissions",
    {
      preHandler: [
        app.authenticateUser,
        requirePermission("manage", "Permission"),
      ],
      schema: {
        tags: ["Roles & Permissions"],
        summary: "Atualizar permissões atribuídas a um cargo",
        security: [{ bearerAuth: [] }],
        params: roleParamsSchema,
        body: updateRolePermissionsBodySchema,
      },
    },
    updateRolePermissionsController,
  );
}
