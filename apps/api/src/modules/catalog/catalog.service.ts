import { prisma } from "../../infrastructure/database/prisma";
import { AppError } from "../../shared/errors/app-error";
import { LotsService } from "../lots/lots.service";
import { PublicProductListQuery, PublicStoreListQuery } from "./catalog.schemas";

export class PublicCatalogService {
  /**
   * Calculate public commercial stock availability via FEFO for a variation
   */
  static async calculateVariationCommercialStock(
    storeId: string,
    variationId: string,
    minDeliveryDays: number = 15,
  ) {
    const stockItems = await prisma.stockItem.findMany({
      where: {
        storeId,
        variationId,
        location: { status: "active" },
      },
      include: {
        lot: true,
      },
    });

    let totalCommercialAvailable = 0;

    for (const item of stockItems) {
      const netAvailable = Math.max(0, item.physicalQuantity - item.reservedQuantity);
      if (netAvailable <= 0) continue;

      let isEligible = true;
      if (item.lot) {
        if (item.lot.status !== "available") {
          isEligible = false;
        }

        const expAnalysis = LotsService.calculateExpirationCondition(
          item.lot.expirationDate,
          minDeliveryDays,
          30,
        );

        if (expAnalysis.isExpired) {
          isEligible = false;
        } else if (item.lot.expirationDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const targetTime = today.getTime() + minDeliveryDays * 24 * 60 * 60 * 1000;
          if (new Date(item.lot.expirationDate).getTime() < targetTime) {
            isEligible = false; // Insufficient shelf life for customer delivery
          }
        }
      }

      if (isEligible) {
        totalCommercialAvailable += netAvailable;
      }
    }

    return totalCommercialAvailable;
  }

  /**
   * List public products with pagination, FEFO stock calculation, and filters
   */
  static async listPublicProducts(query: PublicProductListQuery) {
    const {
      page,
      perPage,
      search,
      categorySlug,
      categoryId,
      brandSlug,
      brandId,
      storeSlug,
      storeId,
      minPrice,
      maxPrice,
      isFeatured,
      sort,
    } = query;

    const skip = (page - 1) * perPage;

    const where: any = {
      status: "active",
      isPublished: true,
      deletedAt: null,
      store: {
        status: "active",
        deletedAt: null,
      },
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { shortDescription: { contains: search, mode: "insensitive" } },
        { fullDescription: { contains: search, mode: "insensitive" } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    } else if (categorySlug) {
      const category = await prisma.category.findUnique({
        where: { slug: categorySlug },
        select: {
          id: true,
          children: {
            select: { id: true },
          },
        },
      });
      if (category) {
        const childIds = category.children.map((c) => c.id);
        where.categoryId = { in: [category.id, ...childIds] };
      }
    }

    if (brandId) {
      where.brandId = brandId;
    } else if (brandSlug) {
      const brand = await prisma.brand.findUnique({
        where: { slug: brandSlug },
      });
      if (brand) {
        where.brandId = brand.id;
      }
    }

    if (storeId) {
      where.storeId = storeId;
    } else if (storeSlug) {
      const store = await prisma.store.findUnique({
        where: { slug: storeSlug },
      });
      if (store) {
        where.storeId = store.id;
      }
    }

    if (isFeatured) {
      where.isFeatured = true;
    }

    // Determine orderBy
    let orderBy: any = [];
    if (sort === "newest") {
      orderBy = [{ createdAt: "desc" }];
    } else if (sort === "featured") {
      orderBy = [{ isFeatured: "desc" }, { createdAt: "desc" }];
    } else {
      orderBy = [{ createdAt: "desc" }];
    }

    const [rawProducts, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          store: {
            select: { id: true, name: true, slug: true, logoUrl: true },
          },
          category: {
            select: { id: true, name: true, slug: true },
          },
          brand: {
            select: { id: true, name: true, slug: true },
          },
          medias: {
            include: { file: true },
            orderBy: [{ isMain: "desc" }, { position: "asc" }],
          },
          variations: {
            where: { status: "active", deletedAt: null },
            orderBy: [{ isDefault: "desc" }, { position: "asc" }],
          },
        },
        orderBy,
        skip,
        take: perPage,
      }),
      prisma.product.count({ where }),
    ]);

    // Process products with FEFO stock calculations
    const formattedProducts = await Promise.all(
      rawProducts.map(async (prod) => {
        const defaultVar = prod.variations[0];
        const minDeliveryDays = prod.minDeliveryShelfLifeDays || 15;

        let totalAvailableStock = 0;
        if (defaultVar) {
          totalAvailableStock =
            await PublicCatalogService.calculateVariationCommercialStock(
              prod.storeId,
              defaultVar.id,
              minDeliveryDays,
            );
        }

        const price = defaultVar ? Number(defaultVar.price) : 0;
        const promotionalPrice = defaultVar?.promotionalPrice
          ? Number(defaultVar.promotionalPrice)
          : null;

        const mainMedia = prod.medias.find((m) => m.isMain) || prod.medias[0];
        const mainImageUrl = mainMedia?.file?.objectKey
          ? `${process.env.R2_PUBLIC_URL || ""}/${mainMedia.file.objectKey}`
          : null;

        return {
          id: prod.id,
          name: prod.name,
          slug: prod.slug,
          shortDescription: prod.shortDescription,
          type: prod.type,
          isFeatured: prod.isFeatured,
          price,
          promotionalPrice,
          mainImageUrl,
          store: prod.store,
          category: prod.category,
          brand: prod.brand,
          commercialStockAvailable: totalAvailableStock,
          isAvailable: totalAvailableStock > 0,
        };
      }),
    );

    // Apply price filter if provided
    let items = formattedProducts;
    if (minPrice !== undefined) {
      items = items.filter((p) => (p.promotionalPrice || p.price) >= minPrice);
    }
    if (maxPrice !== undefined) {
      items = items.filter((p) => (p.promotionalPrice || p.price) <= maxPrice);
    }

    // Sort by price if requested
    if (sort === "price_asc") {
      items.sort((a, b) => (a.promotionalPrice || a.price) - (b.promotionalPrice || b.price));
    } else if (sort === "price_desc") {
      items.sort((a, b) => (b.promotionalPrice || b.price) - (a.promotionalPrice || a.price));
    }

    return {
      data: items,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
        hasNextPage: page * perPage < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Get public product details by slug or ID
   */
  static async getPublicProductDetails(identifier: string) {
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ slug: identifier }, { id: identifier }],
        status: "active",
        isPublished: true,
        deletedAt: null,
        store: {
          status: "active",
          deletedAt: null,
        },
      },
      include: {
        store: {
          select: { id: true, name: true, slug: true, description: true, logoUrl: true, coverUrl: true },
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
        brand: {
          select: { id: true, name: true, slug: true },
        },
        medias: {
          include: { file: true },
          orderBy: [{ isMain: "desc" }, { position: "asc" }],
        },
        options: {
          include: {
            values: { orderBy: { position: "asc" } },
          },
          orderBy: { position: "asc" },
        },
        variations: {
          where: { status: "active", deletedAt: null },
          include: {
            values: {
              include: { optionValue: true },
            },
          },
          orderBy: [{ isDefault: "desc" }, { position: "asc" }],
        },
      },
    });

    if (!product) {
      throw new AppError("NOT_FOUND", "Produto não encontrado ou indisponível no marketplace", 404);
    }

    const minDeliveryDays = product.minDeliveryShelfLifeDays || 15;

    // Calculate stock per variation
    const variationsWithStock = await Promise.all(
      product.variations.map(async (v) => {
        const stock = await PublicCatalogService.calculateVariationCommercialStock(
          product.storeId,
          v.id,
          minDeliveryDays,
        );

        return {
          id: v.id,
          sku: v.sku,
          barcode: v.barcode,
          price: Number(v.price),
          promotionalPrice: v.promotionalPrice ? Number(v.promotionalPrice) : null,
          weight: v.weight,
          isDefault: v.isDefault,
          commercialStockAvailable: stock,
          isAvailable: stock > 0,
          values: v.values.map((val) => ({
            optionValueId: val.optionValueId,
            value: val.optionValue.value,
          })),
        };
      }),
    );

    const images = product.medias.map((m) => ({
      id: m.id,
      isMain: m.isMain,
      altText: m.altText,
      url: m.file?.objectKey
        ? `${process.env.R2_PUBLIC_URL || ""}/${m.file.objectKey}`
        : null,
    }));

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      shortDescription: product.shortDescription,
      fullDescription: product.fullDescription,
      type: product.type,
      isFeatured: product.isFeatured,
      weight: product.weight,
      width: product.width,
      height: product.height,
      length: product.length,
      store: product.store,
      category: product.category,
      brand: product.brand,
      images,
      options: product.options,
      variations: variationsWithStock,
    };
  }

  /**
   * List public categories with hierarchy and product counts
   */
  static async listPublicCategories() {
    const categories = await prisma.category.findMany({
      where: {
        status: "active",
        isVisible: true,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            products: {
              where: {
                status: "active",
                isPublished: true,
                deletedAt: null,
              },
            },
          },
        },
      },
      orderBy: [{ position: "asc" }, { name: "asc" }],
    });

    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      imageUrl: c.imageUrl,
      iconUrl: c.iconUrl,
      parentId: c.parentId,
      productsCount: c._count.products,
    }));
  }

  /**
   * List public active brands
   */
  static async listPublicBrands() {
    const brands = await prisma.brand.findMany({
      where: {
        status: "active",
        isVisible: true,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            products: {
              where: {
                status: "active",
                isPublished: true,
                deletedAt: null,
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return brands.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      description: b.description,
      logoUrl: b.logoUrl,
      productsCount: b._count.products,
    }));
  }

  /**
   * List public partner stores
   */
  static async listPublicStores(query: PublicStoreListQuery) {
    const { page, perPage, search } = query;
    const skip = (page - 1) * perPage;

    const where: any = {
      status: "active",
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [rawStores, total] = await Promise.all([
      prisma.store.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          logoUrl: true,
          coverUrl: true,
          createdAt: true,
          _count: {
            select: {
              products: {
                where: {
                  status: "active",
                  isPublished: true,
                  deletedAt: null,
                },
              },
            },
          },
        },
        orderBy: { name: "asc" },
        skip,
        take: perPage,
      }),
      prisma.store.count({ where }),
    ]);

    const stores = rawStores.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      description: s.description,
      logoUrl: s.logoUrl,
      coverUrl: s.coverUrl,
      productsCount: s._count.products,
    }));

    return {
      data: stores,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
        hasNextPage: page * perPage < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Get public store details by slug
   */
  static async getPublicStoreDetails(slug: string) {
    const store = await prisma.store.findFirst({
      where: {
        slug,
        status: "active",
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        coverUrl: true,
        createdAt: true,
      },
    });

    if (!store) {
      throw new AppError("NOT_FOUND", "Loja parceira não encontrada ou inativa", 404);
    }

    // Get products for this store
    const productsResult = await PublicCatalogService.listPublicProducts({
      storeSlug: slug,
      page: 1,
      perPage: 50,
      sort: "featured",
    });

    return {
      ...store,
      products: productsResult.data,
      totalProducts: productsResult.meta.total,
    };
  }
}
