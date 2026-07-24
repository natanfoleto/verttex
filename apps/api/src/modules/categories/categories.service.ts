import { FastifyRequest } from "fastify";
import { Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/database/prisma";
import { AppError } from "../../shared/errors/app-error";
import { logAudit } from "../../shared/utils/audit";
import {
  CategoryQuery,
  CreateCategoryBody,
  UpdateCategoryBody,
  ReorderCategoriesBody,
} from "./categories.schemas";

export function normalizeSlug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export class CategoriesService {
  async listCategories(query: CategoryQuery) {
    const page = Math.max(1, query.page || 1);
    const perPage = Math.max(1, Math.min(100, query.perPage || 20));
    const skip = (page - 1) * perPage;

    const where: Prisma.CategoryWhereInput = {
      deletedAt: null,
    };

    if (query.search) {
      const search = query.search.trim();
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    if (query.parentId !== undefined) {
      where.parentId =
        query.parentId === "null" || query.parentId === ""
          ? null
          : query.parentId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.isVisible !== undefined) {
      where.isVisible = query.isVisible;
    }

    const [total, categories] = await Promise.all([
      prisma.category.count({ where }),
      prisma.category.findMany({
        where,
        skip,
        take: perPage,
        orderBy: [{ position: "asc" }, { name: "asc" }],
        include: {
          parent: {
            select: { id: true, name: true, slug: true },
          },
          _count: {
            select: { children: true },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / perPage);

    return {
      data: categories,
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

  async getCategoryTree() {
    const allCategories = await prisma.category.findMany({
      where: { deletedAt: null, status: "active" },
      orderBy: [{ position: "asc" }, { name: "asc" }],
    });

    const buildTree = (parentId: string | null = null): any[] => {
      return allCategories
        .filter((cat) => cat.parentId === parentId)
        .map((cat) => ({
          ...cat,
          children: buildTree(cat.id),
        }));
    };

    return buildTree(null);
  }

  async getCategoryById(id: string) {
    const category = await prisma.category.findFirst({
      where: { id, deletedAt: null },
      include: {
        parent: true,
        children: {
          where: { deletedAt: null },
        },
      },
    });

    if (!category) {
      throw new AppError("NOT_FOUND", "Categoria não encontrada", 404);
    }

    return category;
  }

  async createCategory(
    data: CreateCategoryBody,
    actorId?: string,
    req?: FastifyRequest,
  ) {
    const slug = normalizeSlug(data.slug || data.name);

    if (!slug) {
      throw new AppError("VALIDATION_ERROR", "Slug de categoria inválido", 400);
    }

    const existing = await prisma.category.findFirst({
      where: { slug, deletedAt: null },
    });

    if (existing) {
      throw new AppError(
        "CONFLICT",
        "Já existe uma categoria com este slug",
        409,
      );
    }

    if (data.parentId) {
      const parent = await prisma.category.findFirst({
        where: { id: data.parentId, deletedAt: null },
      });
      if (!parent) {
        throw new AppError("NOT_FOUND", "Categoria pai não encontrada", 404);
      }
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        imageUrl: data.imageUrl,
        iconUrl: data.iconUrl,
        parentId: data.parentId || null,
        position: data.position ?? 0,
        status: data.status || "active",
        isVisible: data.isVisible ?? true,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        createdBy: actorId || null,
      },
    });

    await logAudit({
      userId: actorId ?? null,
      action: "CREATE_CATEGORY",
      entity: "Category",
      entityId: category.id,
      newValues: category,
      req,
    });

    return category;
  }

  async updateCategory(
    id: string,
    data: UpdateCategoryBody,
    actorId?: string,
    req?: FastifyRequest,
  ) {
    const previousCategory = await prisma.category.findFirst({
      where: { id, deletedAt: null },
    });

    if (!previousCategory) {
      throw new AppError("NOT_FOUND", "Categoria não encontrada", 404);
    }

    let newSlug: string | undefined;
    if (data.slug || data.name) {
      newSlug = normalizeSlug(data.slug || data.name || previousCategory.name);
      if (newSlug !== previousCategory.slug) {
        const existing = await prisma.category.findFirst({
          where: { slug: newSlug, deletedAt: null, id: { not: id } },
        });
        if (existing) {
          throw new AppError(
            "CONFLICT",
            "Já existe uma categoria com este slug",
            409,
          );
        }
      }
    }

    if (data.parentId !== undefined && data.parentId !== null) {
      if (data.parentId === id) {
        throw new AppError(
          "VALIDATION_ERROR",
          "Uma categoria não pode ser definida como pai de si mesma",
          400,
        );
      }
      await this.validateNoCycle(id, data.parentId);
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        slug: newSlug,
        description: data.description,
        imageUrl: data.imageUrl,
        iconUrl: data.iconUrl,
        parentId: data.parentId,
        position: data.position,
        status: data.status,
        isVisible: data.isVisible,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        updatedBy: actorId || null,
      },
    });

    await logAudit({
      userId: actorId ?? null,
      action: "UPDATE_CATEGORY",
      entity: "Category",
      entityId: id,
      oldValues: previousCategory,
      newValues: updatedCategory,
      req,
    });

    return updatedCategory;
  }

  async deleteCategory(id: string, actorId?: string, req?: FastifyRequest) {
    const category = await prisma.category.findFirst({
      where: { id, deletedAt: null },
      include: {
        children: {
          where: { deletedAt: null },
        },
      },
    });

    if (!category) {
      throw new AppError("NOT_FOUND", "Categoria não encontrada", 404);
    }

    if (category.children.length > 0) {
      throw new AppError(
        "CONFLICT",
        "Não é possível excluir uma categoria que possui subcategorias vinculadas",
        409,
      );
    }

    const archived = await prisma.category.update({
      where: { id },
      data: {
        status: "inactive",
        deletedAt: new Date(),
        deletedBy: actorId || null,
      },
    });

    await logAudit({
      userId: actorId ?? null,
      action: "ARCHIVE_CATEGORY",
      entity: "Category",
      entityId: id,
      oldValues: category,
      newValues: archived,
      req,
    });

    return { message: "Categoria arquivada com sucesso" };
  }

  async reorderCategories(
    body: ReorderCategoriesBody,
    actorId?: string,
    req?: FastifyRequest,
  ) {
    await prisma.$transaction(
      body.items.map((item) =>
        prisma.category.update({
          where: { id: item.id },
          data: { position: item.position },
        }),
      ),
    );

    await logAudit({
      userId: actorId ?? null,
      action: "REORDER_CATEGORIES",
      entity: "Category",
      newValues: body.items,
      req,
    });

    return { message: "Ordem das categorias atualizada com sucesso" };
  }

  private async validateNoCycle(categoryId: string, targetParentId: string) {
    let currentId: string | null = targetParentId;

    while (currentId) {
      if (currentId === categoryId) {
        throw new AppError(
          "VALIDATION_ERROR",
          "Não é possível mover uma categoria para ser subcategoria de um dos seus descendentes (ciclo detectado)",
          400,
        );
      }

      const parentCategory: { parentId: string | null } | null =
        await prisma.category.findUnique({
          where: { id: currentId },
          select: { parentId: true },
        });

      currentId = parentCategory?.parentId || null;
    }
  }
}

export const categoriesService = new CategoriesService();
