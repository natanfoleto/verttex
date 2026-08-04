import { prisma } from "../../infrastructure/database/prisma";

export function normalizeSearchText(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Split a query into individual normalized tokens for AND multi-term matching.
 * "Mel Silvestre" → ["mel", "silvestre"]
 * "  Cachaça   Artesanal  " → ["cachaca", "artesanal"]
 */
export function tokenizeQuery(query: string): string[] {
  const normalized = normalizeSearchText(query);
  return normalized
    .split(" ")
    .map((t) => t.trim())
    .filter((t) => t.length >= 1);
}

export class ProductSearchIndexService {
  /**
   * Build normalized search strings for a single product via 100% Prisma Client
   */
  static async buildSearchDocumentData(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: { select: { name: true } },
        brand: { select: { name: true } },
        store: { select: { name: true } },
        variations: {
          where: { status: "active", deletedAt: null },
          include: {
            values: {
              include: {
                optionValue: true,
              },
            },
          },
        },
      },
    });

    if (!product) return null;

    const titleNormalized = normalizeSearchText(product.name);
    const descriptionNormalized = normalizeSearchText(product.shortDescription || "");

    const contextParts = [
      product.category?.name || "",
      product.brand?.name || "",
      product.store?.name || "",
    ]
      .filter(Boolean)
      .join(" ");

    const contextNormalized = normalizeSearchText(contextParts);

    // Extract unique variant attribute values (deduplication by Set)
    const attributeValues = new Set<string>();
    for (const v of product.variations) {
      for (const vv of v.values) {
        if (vv.optionValue?.value) {
          attributeValues.add(vv.optionValue.value);
        }
      }
    }

    const attributesNormalized = normalizeSearchText(Array.from(attributeValues).join(" "));

    // searchTextNormalized is the full concatenated string for initial candidate selection
    const searchTextNormalized = [
      titleNormalized,
      contextNormalized,
      attributesNormalized,
      descriptionNormalized,
    ]
      .filter(Boolean)
      .join(" ");

    return {
      productId: product.id,
      titleNormalized,
      contextNormalized,
      attributesNormalized,
      descriptionNormalized,
      searchTextNormalized,
    };
  }

  /**
   * Upsert Search Document for a single product via 100% Prisma Client (No Raw SQL)
   */
  static async syncProductSearchDocument(productId: string): Promise<void> {
    try {
      const data = await ProductSearchIndexService.buildSearchDocumentData(productId);
      if (!data) return;

      await prisma.productSearchDocument.upsert({
        where: { productId: data.productId },
        create: data,
        update: {
          titleNormalized: data.titleNormalized,
          contextNormalized: data.contextNormalized,
          attributesNormalized: data.attributesNormalized,
          descriptionNormalized: data.descriptionNormalized,
          searchTextNormalized: data.searchTextNormalized,
        },
      });
    } catch (error) {
      console.error(`[ProductSearchIndexService] Failed to sync document for product ${productId}:`, error);
    }
  }

  /**
   * Refresh all Search Documents for products of a given brand.
   * Used when a brand is renamed. Safely handles errors per product.
   */
  static async refreshByBrand(brandId: string): Promise<void> {
    try {
      const productIds = await prisma.product.findMany({
        where: { brandId, deletedAt: null },
        select: { id: true },
      });
      for (const p of productIds) {
        await ProductSearchIndexService.syncProductSearchDocument(p.id);
      }
    } catch (error) {
      console.error(`[ProductSearchIndexService] Error refreshing brand ${brandId}:`, error);
    }
  }

  /**
   * Refresh all Search Documents for products of a given category.
   * Used when a category is renamed. Safely handles errors per product.
   */
  static async refreshByCategory(categoryId: string): Promise<void> {
    try {
      const productIds = await prisma.product.findMany({
        where: { categoryId, deletedAt: null },
        select: { id: true },
      });
      for (const p of productIds) {
        await ProductSearchIndexService.syncProductSearchDocument(p.id);
      }
    } catch (error) {
      console.error(`[ProductSearchIndexService] Error refreshing category ${categoryId}:`, error);
    }
  }

  /**
   * Refresh all Search Documents for products of a given store.
   * Used when a store/producer is renamed. Safely handles errors per product.
   */
  static async refreshByStore(storeId: string): Promise<void> {
    try {
      const productIds = await prisma.product.findMany({
        where: { storeId, deletedAt: null },
        select: { id: true },
      });
      for (const p of productIds) {
        await ProductSearchIndexService.syncProductSearchDocument(p.id);
      }
    } catch (error) {
      console.error(`[ProductSearchIndexService] Error refreshing store ${storeId}:`, error);
    }
  }

  /**
   * Rebuild ALL Search Documents via Prisma Client.
   * Processes in batches of 100 to avoid memory exhaustion.
   * Idempotent: safe to run multiple times.
   */
  static async rebuildAllSearchDocuments(): Promise<number> {
    const BATCH_SIZE = 100;
    let skip = 0;
    let count = 0;

    while (true) {
      const batch = await prisma.product.findMany({
        where: { deletedAt: null },
        select: { id: true },
        take: BATCH_SIZE,
        skip,
        orderBy: { id: "asc" },
      });

      if (batch.length === 0) break;

      for (const p of batch) {
        await ProductSearchIndexService.syncProductSearchDocument(p.id);
        count++;
      }

      skip += BATCH_SIZE;
    }

    return count;
  }

  /**
   * Diagnostic utility: Report discrepancies between Products and Search Documents.
   * Identifies missing documents for active products and orphan documents for deleted products.
   */
  static async getDiscrepancyReport(): Promise<{
    totalActiveProducts: number;
    totalSearchDocuments: number;
    missingDocumentProductIds: string[];
    orphanDocumentProductIds: string[];
  }> {
    const activeProducts = await prisma.product.findMany({
      where: { deletedAt: null },
      select: { id: true },
    });

    const searchDocs = await prisma.productSearchDocument.findMany({
      select: { productId: true },
    });

    const activeProductSet = new Set(activeProducts.map((p) => p.id));
    const searchDocSet = new Set(searchDocs.map((d) => d.productId));

    const missingDocumentProductIds = activeProducts
      .filter((p) => !searchDocSet.has(p.id))
      .map((p) => p.id);

    const orphanDocumentProductIds = searchDocs
      .filter((d) => !activeProductSet.has(d.productId))
      .map((d) => d.productId);

    return {
      totalActiveProducts: activeProducts.length,
      totalSearchDocuments: searchDocs.length,
      missingDocumentProductIds,
      orphanDocumentProductIds,
    };
  }
}
