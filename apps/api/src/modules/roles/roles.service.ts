import { prisma } from '../../infrastructure/database/prisma'
import { AppError } from '../../shared/errors/app-error'
import { logAudit } from '../../shared/utils/audit'
import { CreateRoleBody, UpdateRoleBody } from './roles.schemas'

export class RolesService {
  async listRoles() {
    return prisma.role.findMany({
      orderBy: { createdAt: 'asc' },
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
    })
  }

  async createRole(data: CreateRoleBody) {
    const existing = await prisma.role.findUnique({
      where: { key: data.key },
    })

    if (existing) {
      throw new AppError('CONFLICT', 'Já existe um cargo com esta chave', 409)
    }

    const role = await prisma.role.create({
      data: {
        key: data.key,
        name: data.name,
        description: data.description,
        isSystem: false,
      },
    })

    await logAudit({
      userId: null,
      action: 'CREATE',
      entity: 'Role',
      entityId: role.id,
      newValues: { key: role.key, name: role.name, description: role.description },
    })

    return role
  }

  async getRole(roleId: string) {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
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
    })

    if (!role) {
      throw new AppError('NOT_FOUND', 'Cargo não encontrado', 404)
    }

    return role
  }

  async updateRole(roleId: string, data: UpdateRoleBody) {
    const previousRole = await prisma.role.findUnique({
      where: { id: roleId },
    })

    if (!previousRole) {
      throw new AppError('NOT_FOUND', 'Cargo não encontrado', 404)
    }

    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
      },
    })

    await logAudit({
      userId: null,
      action: 'UPDATE',
      entity: 'Role',
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
    })

    return updatedRole
  }

  async deleteRole(roleId: string) {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        _count: { select: { users: true } },
      },
    })

    if (!role) {
      throw new AppError('NOT_FOUND', 'Cargo não encontrado', 404)
    }

    if (role.isSystem) {
      throw new AppError(
        'FORBIDDEN',
        'Cargos do sistema não podem ser excluídos',
        403
      )
    }

    if (role._count.users > 0) {
      throw new AppError(
        'CONFLICT',
        'Não é possível excluir um cargo vinculado a usuários ativos',
        400
      )
    }

    await prisma.role.delete({
      where: { id: roleId },
    })

    await logAudit({
      userId: null,
      action: 'DELETE',
      entity: 'Role',
      entityId: roleId,
      oldValues: { key: role.key, name: role.name },
    })

    return { message: 'Cargo excluído com sucesso' }
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
    })

    if (!role) {
      throw new AppError('NOT_FOUND', 'Cargo não encontrado', 404)
    }

    return role.permissions.map((rp) => rp.permission)
  }

  async updateRolePermissions(roleId: string, permissionIds: string[]) {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    })

    if (!role) {
      throw new AppError('NOT_FOUND', 'Cargo não encontrado', 404)
    }

    const previousPermissions = await this.getRolePermissions(roleId)

    await prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({
        where: { roleId },
      })

      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId,
            permissionId,
          })),
        })
      }
    })

    const newPermissions = await this.getRolePermissions(roleId)

    await logAudit({
      userId: null,
      action: 'PERMISSION_CHANGE',
      entity: 'Role',
      entityId: roleId,
      oldValues: previousPermissions.map((p) => ({ key: p.key })),
      newValues: newPermissions.map((p) => ({ key: p.key })),
    })

    return newPermissions
  }
}

