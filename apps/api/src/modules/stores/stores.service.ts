import { FastifyRequest } from "fastify";
import { Prisma } from "@prisma/client";
import { AuthenticatedUserPayload } from "../../@types/fastify";
import { prisma } from "../../infrastructure/database/prisma";
import { AppError } from "../../shared/errors/app-error";
import { logAudit } from "../../shared/utils/audit";
import { normalizeSlug, isSlugReserved } from "./reserved-slugs";
import { UploadService } from "../../shared/services/upload.service";
import {
  StoreQuery,
  CreateStoreBody,
  UpdateStoreBody,
  AddStoreMemberBody,
} from "./stores.schemas";

export class StoresService {
  async createStore(
    userPayload: AuthenticatedUserPayload,
    data: CreateStoreBody,
    req?: FastifyRequest,
  ) {
    const slug = normalizeSlug(data.slug);

    if (!slug) {
      throw new AppError("VALIDATION_ERROR", "Slug inválido", 400);
    }

    if (isSlugReserved(slug)) {
      throw new AppError(
        "CONFLICT",
        "Este slug é uma palavra reservada do sistema e não pode ser utilizado",
        409,
      );
    }

    const existingStore = await prisma.store.findUnique({
      where: { slug },
    });

    if (existingStore) {
      throw new AppError(
        "CONFLICT",
        "Este slug já está em uso por outra loja",
        409,
      );
    }

    return prisma.$transaction(async (tx) => {
      const store = await tx.store.create({
        data: {
          name: data.name,
          slug,
          description: data.description,
          logoUrl: data.logoUrl || null,
          logoFileId: data.logoFileId || null,
          coverUrl: data.coverUrl || null,
          customDomain: data.customDomain || null,
          status: "draft",
        },
      });

      await tx.storeUser.create({
        data: {
          storeId: store.id,
          userId: userPayload.id,
          isOwner: true,
          isActive: true,
        },
      });

      await logAudit({
        userId: userPayload.id,
        action: "CREATE",
        entity: "Store",
        entityId: store.id,
        newValues: store,
        req,
      });

      return store;
    });
  }

  async listStores(userPayload: AuthenticatedUserPayload, query: StoreQuery) {
    const page = Math.max(1, query.page || 1);
    const perPage = Math.max(1, Math.min(100, query.perPage || 20));
    const skip = (page - 1) * perPage;
    const where: Prisma.StoreWhereInput = {
      deletedAt: null,
    };

    if (query.search) {
      const search = query.search.trim();
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    // Scoped access: non-admin users only see linked stores
    if (userPayload.role !== "admin") {
      where.users = {
        some: {
          userId: userPayload.id,
          isActive: true,
        },
      };
    }

    const [total, stores] = await Promise.all([
      prisma.store.count({ where }),
      prisma.store.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { users: true },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / perPage);

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
    };
  }

  async getStore(storeId: string) {
    const store = await prisma.store.findFirst({
      where: { id: storeId, deletedAt: null },
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
    });

    if (!store) {
      throw new AppError("NOT_FOUND", "Loja não encontrada", 404);
    }

    return store;
  }

  async updateStore(
    storeId: string,
    userPayload: AuthenticatedUserPayload,
    data: UpdateStoreBody,
    req?: FastifyRequest,
  ) {
    const previousStore = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!previousStore) {
      throw new AppError("NOT_FOUND", "Loja não encontrada", 404);
    }

    let newSlug: string | undefined;

    if (data.slug) {
      newSlug = normalizeSlug(data.slug);

      if (newSlug !== previousStore.slug) {
        if (isSlugReserved(newSlug)) {
          throw new AppError(
            "CONFLICT",
            "Este slug é uma palavra reservada do sistema e não pode ser utilizado",
            409,
          );
        }

        const existing = await prisma.store.findUnique({
          where: { slug: newSlug },
        });

        if (existing) {
          throw new AppError(
            "CONFLICT",
            "Este slug já está em uso por outra loja",
            409,
          );
        }
      }
    }

    if (data.status === "suspended" && userPayload.role !== "admin") {
      throw new AppError(
        "FORBIDDEN",
        "Apenas administradores podem suspender uma loja",
        403,
      );
    }

    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: {
        name: data.name,
        slug: newSlug,
        description: data.description,
        logoUrl: data.logoUrl !== undefined ? data.logoUrl || null : undefined,
        logoFileId:
          data.logoFileId !== undefined ? data.logoFileId || null : undefined,
        coverUrl:
          data.coverUrl !== undefined ? data.coverUrl || null : undefined,
        customDomain:
          data.customDomain !== undefined
            ? data.customDomain || null
            : undefined,
        status: data.status,
      },
    });

    if (
      data.logoFileId !== undefined &&
      previousStore.logoFileId &&
      previousStore.logoFileId !== data.logoFileId
    ) {
      // Limpeza compensatória da foto de logo anterior
      UploadService.deleteFile(previousStore.logoFileId).catch((err) =>
        console.warn(
          `Erro ao remover logo anterior ${previousStore.logoFileId}:`,
          err,
        ),
      );
    }

    const action =
      data.status && data.status !== previousStore.status
        ? "STATUS_CHANGE"
        : "UPDATE";

    await logAudit({
      userId: userPayload.id,
      action,
      entity: "Store",
      entityId: storeId,
      oldValues: {
        name: previousStore.name,
        slug: previousStore.slug,
        description: previousStore.description,
        status: previousStore.status,
        logoUrl: previousStore.logoUrl,
        coverUrl: previousStore.coverUrl,
        customDomain: previousStore.customDomain,
      },
      newValues: {
        name: updatedStore.name,
        slug: updatedStore.slug,
        description: updatedStore.description,
        status: updatedStore.status,
        logoUrl: updatedStore.logoUrl,
        coverUrl: updatedStore.coverUrl,
        customDomain: updatedStore.customDomain,
      },
      req,
    });

    return updatedStore;
  }

  async deleteStore(storeId: string, userId?: string, req?: FastifyRequest) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new AppError("NOT_FOUND", "Loja não encontrada", 404);
    }

    await prisma.store.update({
      where: { id: storeId },
      data: {
        status: "inactive",
        deletedAt: new Date(),
        deletedBy: userId || null,
      },
    });

    await logAudit({
      userId: userId ?? null,
      action: "ARCHIVE",
      entity: "Store",
      entityId: storeId,
      oldValues: {
        name: store.name,
        slug: store.slug,
        status: store.status,
      },
      newValues: { status: "inactive", deletedAt: new Date() },
      req,
    });

    return { message: "Loja arquivada com sucesso" };
  }

  async restoreStore(storeId: string, userId?: string, req?: FastifyRequest) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new AppError("NOT_FOUND", "Loja não encontrada", 404);
    }

    const restoredStore = await prisma.store.update({
      where: { id: storeId },
      data: {
        status: "active",
        deletedAt: null,
        deletedBy: null,
      },
    });

    await logAudit({
      userId: userId ?? null,
      action: "RESTORE",
      entity: "Store",
      entityId: storeId,
      req,
    });

    return restoredStore;
  }

  async listStoreMembers(storeId: string) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new AppError("NOT_FOUND", "Loja não encontrada", 404);
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
      orderBy: { createdAt: "asc" },
    });

    return members;
  }

  async addStoreMember(
    storeId: string,
    data: AddStoreMemberBody,
    actorId?: string,
    req?: FastifyRequest,
  ) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new AppError("NOT_FOUND", "Loja não encontrada", 404);
    }

    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new AppError("NOT_FOUND", "Usuário não encontrado", 404);
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
    });

    await logAudit({
      userId: actorId ?? null,
      action: "MEMBER_ADD",
      entity: "Store",
      entityId: storeId,
      newValues: { userId: data.userId, isOwner: data.isOwner ?? false },
      req,
    });

    return member;
  }

  async removeStoreMember(
    storeId: string,
    userId: string,
    actorId?: string,
    req?: FastifyRequest,
  ) {
    const storeUser = await prisma.storeUser.findUnique({
      where: {
        storeId_userId: {
          storeId,
          userId,
        },
      },
    });

    if (!storeUser) {
      throw new AppError("NOT_FOUND", "Membro não encontrado nesta loja", 404);
    }

    await prisma.storeUser.delete({
      where: {
        storeId_userId: {
          storeId,
          userId,
        },
      },
    });

    await logAudit({
      userId: actorId ?? null,
      action: "MEMBER_REMOVE",
      entity: "Store",
      entityId: storeId,
      oldValues: { userId, isOwner: storeUser.isOwner },
      req,
    });

    return { message: "Membro removido da loja com sucesso" };
  }

  async uploadStoreLogo(
    storeId: string,
    userPayload: AuthenticatedUserPayload,
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    req?: FastifyRequest,
  ) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new AppError("NOT_FOUND", "Loja não encontrada", 404);
    }

    const previousLogoFileId = store.logoFileId;

    // Direct upload into Cloudflare R2 / Local Storage
    const uploadedFile = await UploadService.directUpload({
      fileName,
      mimeType,
      buffer,
      purpose: "store_logo",
      storeId,
      userId: userPayload.id,
    });

    // Transactional pointer update
    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: {
        logoFileId: uploadedFile.id,
        logoUrl: uploadedFile.publicUrl,
      },
      include: {
        logoFile: true,
      },
    });

    // Compensatory cleanup of previous file if it existed
    if (previousLogoFileId && previousLogoFileId !== uploadedFile.id) {
      UploadService.deleteFile(previousLogoFileId).catch((err) =>
        console.warn(`Erro ao limpar logo antiga ${previousLogoFileId}:`, err),
      );
    }

    await logAudit({
      userId: userPayload.id,
      action: "UPDATE",
      entity: "Store",
      entityId: storeId,
      newValues: {
        logoFileId: uploadedFile.id,
        logoUrl: uploadedFile.publicUrl,
      },
      oldValues: {
        logoFileId: previousLogoFileId,
        logoUrl: store.logoUrl,
      },
      req,
    });

    return updatedStore;
  }

  async removeStoreLogo(
    storeId: string,
    userPayload: AuthenticatedUserPayload,
    req?: FastifyRequest,
  ) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new AppError("NOT_FOUND", "Loja não encontrada", 404);
    }

    const previousLogoFileId = store.logoFileId;

    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: {
        logoFileId: null,
        logoUrl: null,
      },
    });

    if (previousLogoFileId) {
      UploadService.deleteFile(previousLogoFileId).catch((err) =>
        console.warn(`Erro ao deletar logo antiga ${previousLogoFileId}:`, err),
      );
    }

    await logAudit({
      userId: userPayload.id,
      action: "UPDATE",
      entity: "Store",
      entityId: storeId,
      newValues: { logoFileId: null, logoUrl: null },
      oldValues: {
        logoFileId: previousLogoFileId,
        logoUrl: store.logoUrl,
      },
      req,
    });

    return {
      message: "Foto de perfil da loja removida com sucesso!",
      store: updatedStore,
    };
  }

  async getStoreSummary(storeId: string) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new AppError("NOT_FOUND", "Loja não encontrada", 404);
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000,
    );

    const [
      totalProducts,
      activeProducts,
      totalVariations,
      totalOrders,
      pendingOrders,
      stockItemsAgg,
      expiringLotsCount,
      expiredLotsCount,
      recentMovements,
      membersCount,
      reservationsCount,
      lotsCount,
    ] = await Promise.all([
      prisma.product.count({ where: { storeId, deletedAt: null } }),
      prisma.product.count({
        where: { storeId, status: "active", deletedAt: null },
      }),
      prisma.productVariation.count({ where: { storeId, deletedAt: null } }),
      prisma.order.count({ where: { storeId } }),
      prisma.order.count({ where: { storeId, status: "PENDING" } }),
      prisma.stockItem.aggregate({
        where: { storeId },
        _sum: {
          physicalQuantity: true,
          reservedQuantity: true,
        },
      }),
      prisma.productLot.count({
        where: {
          storeId,
          expirationDate: { gte: now, lte: thirtyDaysFromNow },
          status: "available",
        },
      }),
      prisma.productLot.count({
        where: {
          storeId,
          expirationDate: { lt: now },
        },
      }),
      prisma.stockMovement.findMany({
        where: { storeId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          variation: {
            select: { sku: true, product: { select: { name: true } } },
          },
        },
      }),
      prisma.storeUser.count({ where: { storeId } }),
      prisma.stockReservation.count({ where: { storeId, status: "ACTIVE" } }),
      prisma.productLot.count({ where: { storeId } }),
    ]);

    const totalPhysicalStock = stockItemsAgg._sum.physicalQuantity || 0;
    const totalReservedStock = stockItemsAgg._sum.reservedQuantity || 0;

    const lowStockItems = await prisma.stockItem.count({
      where: { storeId, physicalQuantity: { lte: 5 } },
    });

    return {
      storeId,
      metrics: {
        totalProducts,
        activeProducts,
        totalVariations,
        totalOrders,
        pendingOrders,
        totalPhysicalStock,
        totalReservedStock,
        availableStock: Math.max(0, totalPhysicalStock - totalReservedStock),
        lowStockItems,
        expiringLotsCount,
        expiredLotsCount,
        membersCount,
        reservationsCount,
        lotsCount,
      },
      recentMovements,
    };
  }
}
