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

    // Extract unique variant attribute values
    const attributeValues = new Set<string>();
    for (const v of product.variations) {
      for (const vv of v.values) {
        if (vv.optionValue?.value) {
          attributeValues.add(vv.optionValue.value);
        }
      }
    }

    const attributesNormalized = normalizeSearchText(Array.from(attributeValues).join(" "));

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
   * Rebuild all Search Documents via Prisma Client (Batch/Backfill)
   */
  static async rebuildAllSearchDocuments(): Promise<number> {
    const products = await prisma.product.findMany({
      where: { status: "active", deletedAt: null },
      select: { id: true },
    });

    let count = 0;
    for (const p of products) {
      await ProductSearchIndexService.syncProductSearchDocument(p.id);
      count++;
    }

    return count;
  }
}
