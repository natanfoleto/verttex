import { prisma } from '../../infrastructure/database/prisma'
import { AppError } from '../../shared/errors/app-error'
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

    return prisma.role.create({
      data: {
        key: data.key,
        name: data.name,
        description: data.description,
        isSystem: false,
      },
    })
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
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    })

    if (!role) {
      throw new AppError('NOT_FOUND', 'Cargo não encontrado', 404)
    }

    return prisma.role.update({
      where: { id: roleId },
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
      },
    })
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

    return this.getRolePermissions(roleId)
  }
}
