import { AuthenticatedUserPayload } from '../../@types/fastify'
import { prisma } from '../../infrastructure/database/prisma'
import { AppError } from '../../shared/errors/app-error'
import { normalizeSlug, isSlugReserved } from './reserved-slugs'
import {
  StoreQuery,
  CreateStoreBody,
  UpdateStoreBody,
  AddStoreMemberBody,
} from './stores.schemas'

export class StoresService {
  async createStore(
    userPayload: AuthenticatedUserPayload,
    data: CreateStoreBody
  ) {
    const slug = normalizeSlug(data.slug)

    if (!slug) {
      throw new AppError('VALIDATION_ERROR', 'Slug inválido', 400)
    }

    if (isSlugReserved(slug)) {
      throw new AppError(
        'CONFLICT',
        'Este slug é uma palavra reservada do sistema e não pode ser utilizado',
        409
      )
    }

    const existingStore = await prisma.store.findUnique({
      where: { slug },
    })

    if (existingStore) {
      throw new AppError(
        'CONFLICT',
        'Este slug já está em uso por outra loja',
        409
      )
    }

    return prisma.$transaction(async (tx) => {
      const store = await tx.store.create({
        data: {
          name: data.name,
          slug,
          description: data.description,
          logoUrl: data.logoUrl || null,
          coverUrl: data.coverUrl || null,
          customDomain: data.customDomain || null,
          status: 'draft',
        },
      })

      await tx.storeUser.create({
        data: {
          storeId: store.id,
          userId: userPayload.id,
          isOwner: true,
          isActive: true,
        },
      })

      return store
    })
  }

  async listStores(userPayload: AuthenticatedUserPayload, query: StoreQuery) {
    const page = Math.max(1, query.page || 1)
    const perPage = Math.max(1, Math.min(100, query.perPage || 20))
    const skip = (page - 1) * perPage

    const where: any = {}

    if (query.search) {
      const search = query.search.trim()
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (query.status) {
      where.status = query.status
    }

    // Scoped access: non-admin users only see linked stores
    if (userPayload.role !== 'admin') {
      where.users = {
        some: {
          userId: userPayload.id,
          isActive: true,
        },
      }
    }

    const [total, stores] = await Promise.all([
      prisma.store.count({ where }),
      prisma.store.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { users: true },
          },
        },
      }),
    ])

    const totalPages = Math.ceil(total / perPage)

    return {
      data: stores,
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

  async getStore(storeId: string) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                status: true,
              },
            },
          },
        },
      },
    })

    if (!store) {
      throw new AppError('NOT_FOUND', 'Loja não encontrada', 404)
    }

    return store
  }

  async updateStore(
    storeId: string,
    userPayload: AuthenticatedUserPayload,
    data: UpdateStoreBody
  ) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    })

    if (!store) {
      throw new AppError('NOT_FOUND', 'Loja não encontrada', 404)
    }

    let newSlug: string | undefined

    if (data.slug) {
      newSlug = normalizeSlug(data.slug)

      if (newSlug !== store.slug) {
        if (isSlugReserved(newSlug)) {
          throw new AppError(
            'CONFLICT',
            'Este slug é uma palavra reservada do sistema e não pode ser utilizado',
            409
          )
        }

        const existing = await prisma.store.findUnique({
          where: { slug: newSlug },
        })

        if (existing) {
          throw new AppError(
            'CONFLICT',
            'Este slug já está em uso por outra loja',
            409
          )
        }
      }
    }

    if (data.status === 'suspended' && userPayload.role !== 'admin') {
      throw new AppError(
        'FORBIDDEN',
        'Apenas administradores podem suspender uma loja',
        403
      )
    }

    return prisma.store.update({
      where: { id: storeId },
      data: {
        name: data.name,
        slug: newSlug,
        description: data.description,
        logoUrl: data.logoUrl !== undefined ? data.logoUrl || null : undefined,
        coverUrl:
          data.coverUrl !== undefined ? data.coverUrl || null : undefined,
        customDomain:
          data.customDomain !== undefined
            ? data.customDomain || null
            : undefined,
        status: data.status,
      },
    })
  }

  async deleteStore(storeId: string) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    })

    if (!store) {
      throw new AppError('NOT_FOUND', 'Loja não encontrada', 404)
    }

    await prisma.store.update({
      where: { id: storeId },
      data: { status: 'inactive' },
    })

    return { message: 'Loja desativada com sucesso' }
  }

  async listStoreMembers(storeId: string) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    })

    if (!store) {
      throw new AppError('NOT_FOUND', 'Loja não encontrada', 404)
    }

    const members = await prisma.storeUser.findMany({
      where: { storeId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return members
  }

  async addStoreMember(storeId: string, data: AddStoreMemberBody) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    })

    if (!store) {
      throw new AppError('NOT_FOUND', 'Loja não encontrada', 404)
    }

    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    })

    if (!user) {
      throw new AppError('NOT_FOUND', 'Usuário não encontrado', 404)
    }

    const member = await prisma.storeUser.upsert({
      where: {
        storeId_userId: {
          storeId,
          userId: data.userId,
        },
      },
      create: {
        storeId,
        userId: data.userId,
        isOwner: data.isOwner ?? false,
        isActive: true,
      },
      update: {
        isOwner: data.isOwner,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
          },
        },
      },
    })

    return member
  }

  async removeStoreMember(storeId: string, userId: string) {
    const storeUser = await prisma.storeUser.findUnique({
      where: {
        storeId_userId: {
          storeId,
          userId,
        },
      },
    })

    if (!storeUser) {
      throw new AppError('NOT_FOUND', 'Membro não encontrado nesta loja', 404)
    }

    await prisma.storeUser.delete({
      where: {
        storeId_userId: {
          storeId,
          userId,
        },
      },
    })

    return { message: 'Membro removido da loja com sucesso' }
  }
}
