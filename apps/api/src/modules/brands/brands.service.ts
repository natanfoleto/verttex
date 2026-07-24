import { FastifyRequest } from "fastify";
import { Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/database/prisma";
import { AppError } from "../../shared/errors/app-error";
import { logAudit } from "../../shared/utils/audit";
import { normalizeSlug } from "../categories/categories.service";
import { BrandQuery, CreateBrandBody, UpdateBrandBody } from "./brands.schemas";

export class BrandsService {
  async listBrands(query: BrandQuery) {
    const page = Math.max(1, query.page || 1);
    const perPage = Math.max(1, Math.min(100, query.perPage || 20));
    const skip = (page - 1) * perPage;

    const where: Prisma.BrandWhereInput = {
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

    if (query.isVisible !== undefined) {
      where.isVisible = query.isVisible;
    }

    const [total, brands] = await Promise.all([
      prisma.brand.count({ where }),
      prisma.brand.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { name: "asc" },
      }),
    ]);

    const totalPages = Math.ceil(total / perPage);

    return {
      data: brands,
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

  async getBrandById(id: string) {
    const brand = await prisma.brand.findFirst({
      where: { id, deletedAt: null },
    });

    if (!brand) {
      throw new AppError("NOT_FOUND", "Marca não encontrada", 404);
    }

    return brand;
  }

  async createBrand(
    data: CreateBrandBody,
    actorId?: string,
    req?: FastifyRequest,
  ) {
    const slug = normalizeSlug(data.slug || data.name);

    if (!slug) {
      throw new AppError("VALIDATION_ERROR", "Slug de marca inválido", 400);
    }

    const existing = await prisma.brand.findFirst({
      where: { slug, deletedAt: null },
    });

    if (existing) {
      throw new AppError("CONFLICT", "Já existe uma marca com este slug", 409);
    }

    const brand = await prisma.brand.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        logoUrl: data.logoUrl,
        status: data.status || "active",
        isVisible: data.isVisible ?? true,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        createdBy: actorId || null,
      },
    });

    await logAudit({
      userId: actorId ?? null,
      action: "CREATE_BRAND",
      entity: "Brand",
      entityId: brand.id,
      newValues: brand,
      req,
    });

    return brand;
  }

  async updateBrand(
    id: string,
    data: UpdateBrandBody,
    actorId?: string,
    req?: FastifyRequest,
  ) {
    const previousBrand = await prisma.brand.findFirst({
      where: { id, deletedAt: null },
    });

    if (!previousBrand) {
      throw new AppError("NOT_FOUND", "Marca não encontrada", 404);
    }

    let newSlug: string | undefined;
    if (data.slug || data.name) {
      newSlug = normalizeSlug(data.slug || data.name || previousBrand.name);
      if (newSlug !== previousBrand.slug) {
        const existing = await prisma.brand.findFirst({
          where: { slug: newSlug, deletedAt: null, id: { not: id } },
        });
        if (existing) {
          throw new AppError(
            "CONFLICT",
            "Já existe uma marca com este slug",
            409,
          );
        }
      }
    }

    const updatedBrand = await prisma.brand.update({
      where: { id },
      data: {
        name: data.name,
        slug: newSlug,
        description: data.description,
        logoUrl: data.logoUrl,
        status: data.status,
        isVisible: data.isVisible,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        updatedBy: actorId || null,
      },
    });

    await logAudit({
      userId: actorId ?? null,
      action: "UPDATE_BRAND",
      entity: "Brand",
      entityId: id,
      oldValues: previousBrand,
      newValues: updatedBrand,
      req,
    });

    return updatedBrand;
  }

  async deleteBrand(id: string, actorId?: string, req?: FastifyRequest) {
    const brand = await prisma.brand.findFirst({
      where: { id, deletedAt: null },
    });

    if (!brand) {
      throw new AppError("NOT_FOUND", "Marca não encontrada", 404);
    }

    const archived = await prisma.brand.update({
      where: { id },
      data: {
        status: "inactive",
        deletedAt: new Date(),
        deletedBy: actorId || null,
      },
    });

    await logAudit({
      userId: actorId ?? null,
      action: "ARCHIVE_BRAND",
      entity: "Brand",
      entityId: id,
      oldValues: brand,
      newValues: archived,
      req,
    });

    return { message: "Marca arquivada com sucesso" };
  }
}

export const brandsService = new BrandsService();
