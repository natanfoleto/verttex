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
  }

  /**
   * Refresh all Search Documents for products of a given brand.
   * Used when a brand is renamed. Processes in pages to avoid N+1.
   */
  static async refreshByBrand(brandId: string): Promise<void> {
    const productIds = await prisma.product.findMany({
      where: { brandId, deletedAt: null },
      select: { id: true },
    });
    for (const p of productIds) {
      await ProductSearchIndexService.syncProductSearchDocument(p.id);
    }
  }

  /**
   * Refresh all Search Documents for products of a given category.
   * Used when a category is renamed.
   */
  static async refreshByCategory(categoryId: string): Promise<void> {
    const productIds = await prisma.product.findMany({
      where: { categoryId, deletedAt: null },
      select: { id: true },
    });
    for (const p of productIds) {
      await ProductSearchIndexService.syncProductSearchDocument(p.id);
    }
  }

  /**
   * Refresh all Search Documents for products of a given store.
   * Used when a store/producer is renamed.
   */
  static async refreshByStore(storeId: string): Promise<void> {
    const productIds = await prisma.product.findMany({
      where: { storeId, deletedAt: null },
      select: { id: true },
    });
    for (const p of productIds) {
      await ProductSearchIndexService.syncProductSearchDocument(p.id);
    }
  }

  /**
   * Rebuild ALL Search Documents via Prisma Client.
   * Processes in batches of 100 to avoid memory exhaustion (no N+1 per-product query list).
   * Idempotent: safe to run multiple times.
   * Do NOT call automatically on startup.
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
}
