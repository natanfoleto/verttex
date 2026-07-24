import { FastifyRequest } from "fastify";
import { Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/database/prisma";
import { AppError } from "../../shared/errors/app-error";
import { logAudit } from "../../shared/utils/audit";
import {
  CreateRoleBody,
  UpdateRoleBody,
  RoleQuery,
  UpdateRolePermissionsBody,
} from "./roles.schemas";

export class RolesService {
  async listRoles(query?: RoleQuery) {
    const page = Math.max(1, query?.page || 1);
    const perPage = Math.max(1, Math.min(100, query?.perPage || 20));
    const skip = (page - 1) * perPage;

    const where: Prisma.RoleWhereInput = {
      deletedAt: null,
    };

    if (query?.search) {
      const search = query.search.trim();
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { key: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, roles] = await Promise.all([
      prisma.role.count({ where }),
      prisma.role.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: "asc" },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
          _count: {
            select: { users: true },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / perPage);

    return {
      data: roles,
      meta: {
        page,
        perPage,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async createRole(
    data: CreateRoleBody,
    actorId?: string,
    req?: FastifyRequest,
  ) {
    const existing = await prisma.role.findUnique({
      where: { key: data.key },
    });

    if (existing) {
      throw new AppError("CONFLICT", "Já existe um cargo com esta chave", 409);
    }

    const role = await prisma.role.create({
      data: {
        key: data.key,
        name: data.name,
        description: data.description,
        isSystem: false,
      },
    });

    await logAudit({
      userId: actorId ?? null,
      action: "CREATE",
      entity: "Role",
      entityId: role.id,
      newValues: {
        key: role.key,
        name: role.name,
        description: role.description,
      },
      req,
    });

    return role;
  }

  async getRole(roleId: string) {
    const role = await prisma.role.findFirst({
      where: { id: roleId, deletedAt: null },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
    });

    if (!role) {
      throw new AppError("NOT_FOUND", "Cargo não encontrado", 404);
    }

    return role;
  }

  async updateRole(
    roleId: string,
    data: UpdateRoleBody,
    actorId?: string,
    req?: FastifyRequest,
  ) {
    const previousRole = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!previousRole) {
      throw new AppError("NOT_FOUND", "Cargo não encontrado", 404);
    }

    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
      },
    });

    await logAudit({
      userId: actorId ?? null,
      action: "UPDATE",
      entity: "Role",
      entityId: roleId,
      oldValues: {
        name: previousRole.name,
        description: previousRole.description,
        isActive: previousRole.isActive,
      },
      newValues: {
        name: updatedRole.name,
        description: updatedRole.description,
        isActive: updatedRole.isActive,
      },
      req,
    });

    return updatedRole;
  }

  async deleteRole(roleId: string, actorId?: string, req?: FastifyRequest) {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        _count: { select: { users: true } },
      },
    });

    if (!role) {
      throw new AppError("NOT_FOUND", "Cargo não encontrado", 404);
    }

    if (role.isSystem) {
      throw new AppError(
        "FORBIDDEN",
        "Cargos do sistema não podem ser excluídos",
        403,
      );
    }

    if (role._count.users > 0) {
      throw new AppError(
        "CONFLICT",
        "Não é possível excluir um cargo vinculado a usuários ativos",
        400,
      );
    }

    await prisma.role.delete({
      where: { id: roleId },
    });

    await logAudit({
      userId: actorId ?? null,
      action: "DELETE",
      entity: "Role",
      entityId: roleId,
      oldValues: { key: role.key, name: role.name },
      req,
    });

    return { message: "Cargo excluído com sucesso" };
  }

  async getRolePermissions(roleId: string) {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new AppError("NOT_FOUND", "Cargo não encontrado", 404);
    }

    return role.permissions.map((rp) => rp.permission);
  }

  async updateRolePermissions(
    roleId: string,
    body: UpdateRolePermissionsBody,
    actorId?: string,
    req?: FastifyRequest,
  ) {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new AppError("NOT_FOUND", "Cargo não encontrado", 404);
    }

    const { permissionIds, strategy = "ALL", targetUserIds = [] } = body;
    const previousPermissions = await this.getRolePermissions(roleId);
    const previousPermIds = new Set(previousPermissions.map((p) => p.id));
    const newPermIds = new Set(permissionIds);

    // Identify permissions that were removed from the role
    const removedPermIds = Array.from(previousPermIds).filter(
      (id) => !newPermIds.has(id),
    );

    await prisma.$transaction(async (tx) => {
      // Handle Preservation Strategies (B: PRESERVE_ALL and C: CUSTOM)
      if (
        (strategy === "PRESERVE_ALL" || strategy === "CUSTOM") &&
        removedPermIds.length > 0
      ) {
        let usersToPreserve: string[] = [];

        if (strategy === "PRESERVE_ALL") {
          const roleUsers = await tx.user.findMany({
            where: { roleId, deletedAt: null },
            select: { id: true },
          });
          usersToPreserve = roleUsers.map((u) => u.id);
        } else if (strategy === "CUSTOM") {
          usersToPreserve = targetUserIds;
        }

        // For each user preserving access, create an explicit ALLOW override if they don't already have an override
        for (const userId of usersToPreserve) {
          for (const permId of removedPermIds) {
            const existingOverride = await tx.userPermission.findUnique({
              where: { userId_permissionId: { userId, permissionId: permId } },
            });

            if (!existingOverride) {
              await tx.userPermission.create({
                data: {
                  userId,
                  permissionId: permId,
                  effect: "allow",
                },
              });
            }
          }
        }
      }

      // Overwrite RolePermissions
      await tx.rolePermission.deleteMany({
        where: { roleId },
      });

      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId,
            permissionId,
          })),
        });
      }
    });

    const newPermissions = await this.getRolePermissions(roleId);

    await logAudit({
      userId: actorId ?? null,
      action: "PERMISSION_CHANGE",
      entity: "Role",
      entityId: roleId,
      oldValues: { permissions: previousPermissions.map((p) => p.key) },
      newValues: {
        permissions: newPermissions.map((p) => p.key),
        strategy,
        targetUserIdsCount: targetUserIds.length,
      },
      req,
    });

    return newPermissions;
  }
}
