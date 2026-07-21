import { prisma } from '../../infrastructure/database/prisma'
import { AppError } from '../../shared/errors/app-error'
import { hashPassword } from '../../shared/utils/crypto'
import { logAudit } from '../../shared/utils/audit'
import {
  UserQuery,
  CreateUserBody,
  UpdateUserBody,
  UpdateUserPermissionsBody,
} from './users.schemas'

export class UsersService {
  async listUsers(query: UserQuery) {
    const page = Math.max(1, query.page || 1)
    const perPage = Math.max(1, Math.min(100, query.perPage || 20))
    const skip = (page - 1) * perPage

    const where: any = {}

    if (query.search) {
      const search = query.search.trim()
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (query.roleId) {
      where.roleId = query.roleId
    }

    if (query.status) {
      where.status = query.status
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          roleId: true,
          role: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ])

    const totalPages = Math.ceil(total / perPage)

    return {
      data: users,
      meta: {
        page,
        perPage,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    }
  }

  async createUser(data: CreateUserBody) {
    const email = data.email.toLowerCase().trim()

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new AppError('CONFLICT', 'Este e-mail já está em uso', 409)
    }

    const role = await prisma.role.findUnique({
      where: { id: data.roleId },
    })

    if (!role) {
      throw new AppError('NOT_FOUND', 'Cargo não encontrado', 404)
    }

    const passwordHash = await hashPassword(data.password)

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email,
        phone: data.phone,
        passwordHash,
        roleId: data.roleId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        roleId: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    await logAudit({
      userId: null,
      action: 'CREATE',
      entity: 'User',
      entityId: user.id,
      newValues: user,
    })

    return user
  }

  async getUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        roleId: true,
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
        permissions: {
          include: { permission: true },
        },
        stores: {
          include: { store: true },
        },
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      throw new AppError('NOT_FOUND', 'Usuário não encontrado', 404)
    }

    return user
  }

  async updateUser(userId: string, data: UpdateUserBody) {
    const previousUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    })

    if (!previousUser) {
      throw new AppError('NOT_FOUND', 'Usuário não encontrado', 404)
    }

    if (data.email && data.email.toLowerCase().trim() !== previousUser.email) {
      const email = data.email.toLowerCase().trim()
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) {
        throw new AppError('CONFLICT', 'Este e-mail já está em uso', 409)
      }
    }

    if (data.roleId && data.roleId !== previousUser.roleId) {
      const role = await prisma.role.findUnique({ where: { id: data.roleId } })
      if (!role) {
        throw new AppError('NOT_FOUND', 'Cargo não encontrado', 404)
      }
    }

    // Check last admin protection if deactivating
    if (data.status && data.status !== 'active' && previousUser.role.key === 'admin') {
      await this.ensureNotLastAdmin(userId)
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        email: data.email ? data.email.toLowerCase().trim() : undefined,
        phone: data.phone,
        roleId: data.roleId,
        status: data.status,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        roleId: true,
        role: true,
        updatedAt: true,
      },
    })

    const action = data.status && data.status !== previousUser.status ? 'STATUS_CHANGE' : 'UPDATE'

    await logAudit({
      userId: null,
      action,
      entity: 'User',
      entityId: userId,
      oldValues: {
        name: previousUser.name,
        email: previousUser.email,
        phone: previousUser.phone,
        status: previousUser.status,
        roleId: previousUser.roleId,
      },
      newValues: {
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        status: updatedUser.status,
        roleId: updatedUser.roleId,
      },
    })

    return updatedUser
  }

  async deleteUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    })

    if (!user) {
      throw new AppError('NOT_FOUND', 'Usuário não encontrado', 404)
    }

    if (user.role.key === 'admin') {
      await this.ensureNotLastAdmin(userId)
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status: 'inactive' },
    })

    await logAudit({
      userId: null,
      action: 'DELETE',
      entity: 'User',
      entityId: userId,
      oldValues: {
        name: user.name,
        email: user.email,
        status: user.status,
        roleId: user.roleId,
      },
      newValues: { status: 'inactive' },
    })

    return { message: 'Usuário desativado com sucesso' }
  }

  async getUserStores(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new AppError('NOT_FOUND', 'Usuário não encontrado', 404)
    }

    const storeUsers = await prisma.storeUser.findMany({
      where: { userId },
      include: { store: true },
    })

    return storeUsers.map((su) => su.store)
  }

  async getUserPermissions(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new AppError('NOT_FOUND', 'Usuário não encontrado', 404)
    }

    return prisma.userPermission.findMany({
      where: { userId },
      include: { permission: true },
    })
  }

  async updateUserPermissions(userId: string, body: UpdateUserPermissionsBody) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new AppError('NOT_FOUND', 'Usuário não encontrado', 404)
    }

    const previousPermissions = await this.getUserPermissions(userId)

    await prisma.$transaction(async (tx) => {
      await tx.userPermission.deleteMany({
        where: { userId },
      })

      if (body.overrides.length > 0) {
        await tx.userPermission.createMany({
          data: body.overrides.map((override) => ({
            userId,
            permissionId: override.permissionId,
            effect: override.effect,
          })),
        })
      }
    })

    const newPermissions = await this.getUserPermissions(userId)

    await logAudit({
      userId: null,
      action: 'PERMISSION_CHANGE',
      entity: 'User',
      entityId: userId,
      oldValues: previousPermissions.map((p) => ({
        permissionKey: p.permission.key,
        effect: p.effect,
      })),
      newValues: newPermissions.map((p) => ({
        permissionKey: p.permission.key,
        effect: p.effect,
      })),
    })

    return newPermissions
  }

  private async ensureNotLastAdmin(userId: string) {
    const activeAdminCount = await prisma.user.count({
      where: {
        status: 'active',
        role: { key: 'admin' },
        id: { not: userId },
      },
    })

    if (activeAdminCount === 0) {
      throw new AppError(
        'FORBIDDEN',
        'Não é possível desativar ou alterar o último administrador ativo do sistema',
        403
      )
    }
  }
}
