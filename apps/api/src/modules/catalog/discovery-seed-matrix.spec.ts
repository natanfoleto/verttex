import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../infrastructure/database/prisma";
import { PublicDiscoveryService } from "./discovery.service";
import { GOLDEN_DATASET_PRODUCTS } from "./discovery-golden-dataset.fixture";
import { normalizeSearchText, tokenizeQuery } from "./product-search-index.service";

vi.mock("../../infrastructure/database/prisma", () => ({
  prisma: {
    product: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    category: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    store: {
      findFirst: vi.fn(),
    },
    brand: {
      findFirst: vi.fn(),
    },
    stockItem: {
      findMany: vi.fn(),
    },
    marketplaceSettings: {
      findFirst: vi.fn(),
    },
    productVariation: {
      findMany: vi.fn(),
    },
    productSearchDocument: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

function mockPrisma<T extends (...args: never[]) => unknown>(fn: T) {
  return vi.mocked(fn as unknown as (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>>);
}

function setupMatrixMocks() {
  const activeProducts = GOLDEN_DATASET_PRODUCTS.filter((p) => p.isPublished && !p.deletedAt && p.storeIsPublished);

  const searchDocs = activeProducts.map((p) => {
    const titleNormalized = normalizeSearchText(p.name);
    const contextNormalized = normalizeSearchText(`${p.categoryName} ${p.brandName || ""} ${p.storeName}`);
    const attributesNormalized = p.attributes.map((a) => normalizeSearchText(a.value)).join(" ");
    const descriptionNormalized = normalizeSearchText(p.description);
    const searchTextNormalized = `${titleNormalized} ${contextNormalized} ${attributesNormalized} ${descriptionNormalized}`;

    return {
      productId: p.id,
      sku: p.sku,
      barcode: p.barcode || null,
      titleNormalized,
      contextNormalized,
      attributesNormalized,
      descriptionNormalized,
      searchTextNormalized,
      price: p.price,
      promotionalPrice: p.promotionalPrice || null,
      isOffer: Boolean(p.promotionalPrice && p.promotionalPrice < p.price),
      isFeatured: p.isFeatured,
      inStock: p.stockTotal > 0 && !p.hasExpiredStockOnly,
      categoryId: p.categoryId,
      categorySlug: p.categorySlug,
      brandId: p.brandId || null,
      brandSlug: p.brandSlug || null,
      storeId: p.storeId,
      storeSlug: p.storeSlug,
    };
  });

  const fullProducts = activeProducts.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    sku: p.sku,
    barcode: p.barcode || null,
    promotionalPrice: p.promotionalPrice || null,
    isPublished: p.isPublished,
    status: "active",
    deletedAt: p.deletedAt || null,
    storeId: p.storeId,
    categoryId: p.categoryId,
    brandId: p.brandId || null,
    category: { id: p.categoryId, name: p.categoryName, slug: p.categorySlug },
    brand: p.brandId ? { id: p.brandId, name: p.brandName!, slug: p.brandSlug! } : null,
    store: { id: p.storeId, name: p.storeName, slug: p.storeSlug, isPublished: true, status: "active", deletedAt: null },
    images: [{ url: "https://example.com/img.jpg" }],
    medias: [{ isMain: true, file: { objectKey: "img.jpg" } }],
    variations: p.variations.map((v) => ({
      id: v.id,
      sku: v.sku,
      barcode: v.barcode || null,
      price: v.price,
      values: Object.entries(v.attributes || {}).map(([key, val]) => ({
        optionValue: { option: { name: key }, value: val },
      })),
      stockItems: [{ quantity: p.stockTotal }],
    })),
  }));

  mockPrisma(prisma.category.findFirst).mockResolvedValue(null);
  mockPrisma(prisma.store.findFirst).mockResolvedValue(null);
  mockPrisma(prisma.brand.findFirst).mockResolvedValue(null);

  mockPrisma(prisma.stockItem.findMany).mockImplementation(
    async (args?: Parameters<typeof prisma.stockItem.findMany>[0]) => {
      const varIds: string[] = (args?.where?.variationId as { in?: string[] } | undefined)?.in || [];
      return varIds.map((vId) => ({
        id: `stock-${vId}`,
        variationId: vId,
        physicalQuantity: 100,
        reservedQuantity: 0,
        storeId: "store-apiario-serra",
        location: { status: "active" },
        lot: { status: "available", expirationDate: new Date("2028-01-01") },
      })) as unknown as Awaited<ReturnType<typeof prisma.stockItem.findMany>>;
    }
  );

  mockPrisma(prisma.marketplaceSettings.findFirst).mockResolvedValue({
    id: "settings-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    bannerPosition: "NO_DISPLAY",
    outOfStockBehavior: "show_badge",
    platformPublicName: "VERTTEX",
    globalNoticeActive: false,
    globalNoticeMessage: null,
    globalNoticeType: null,
  } as unknown as Awaited<ReturnType<typeof prisma.marketplaceSettings.findFirst>>);

  mockPrisma(prisma.productSearchDocument.findMany).mockImplementation(
    async (args?: Parameters<typeof prisma.productSearchDocument.findMany>[0]) => {
      let result = [...searchDocs];
      const searchWhere = args?.where?.searchTextNormalized as { contains?: string } | undefined;
      if (searchWhere?.contains) {
        const token = searchWhere.contains;
        result = result.filter((d) => d.searchTextNormalized.includes(token));
      }
      return result as unknown as Awaited<ReturnType<typeof prisma.productSearchDocument.findMany>>;
    }
  );

  mockPrisma(prisma.productVariation.findMany).mockImplementation(
    async (args?: Parameters<typeof prisma.productVariation.findMany>[0]) => {
      if (args?.where?.OR && Array.isArray(args.where.OR)) {
        const firstOr = args.where.OR[0] as { sku?: { equals?: string } } | undefined;
        const secondOr = args.where.OR[1] as { barcode?: { equals?: string } } | undefined;
        const skuTerm = firstOr?.sku?.equals;
        const barcodeTerm = secondOr?.barcode?.equals;

        const matched = fullProducts.flatMap((p) =>
          p.variations
            .filter(
              (v) =>
                (skuTerm && v.sku?.toLowerCase() === skuTerm.toLowerCase()) ||
                (barcodeTerm && v.barcode?.toLowerCase() === barcodeTerm.toLowerCase())
            )
            .map(() => ({ productId: p.id }))
        );
        return matched as unknown as Awaited<ReturnType<typeof prisma.productVariation.findMany>>;
      }
      return [] as unknown as Awaited<ReturnType<typeof prisma.productVariation.findMany>>;
    }
  );

  mockPrisma(prisma.product.findMany).mockImplementation(
    async (args?: Parameters<typeof prisma.product.findMany>[0]) => {
      let result = [...fullProducts];

      const idWhere = args?.where?.id as { in?: string[] } | undefined;
      if (idWhere?.in) {
        const ids: string[] = idWhere.in;
        result = result.filter((p) => ids.includes(p.id));
      }

      if (args?.where?.OR && Array.isArray(args.where.OR)) {
        const firstOr = args.where.OR[0] as { sku?: { equals?: string } } | undefined;
        const secondOr = args.where.OR[1] as { barcode?: { equals?: string } } | undefined;
        const skuEq = firstOr?.sku?.equals;
        const barcodeEq = secondOr?.barcode?.equals;

        if (skuEq || barcodeEq) {
          result = result.filter(
            (p) =>
              (skuEq && (p.sku?.toLowerCase() === skuEq.toLowerCase() || p.variations?.some((v) => v.sku?.toLowerCase() === skuEq.toLowerCase()))) ||
              (barcodeEq && (p.barcode?.toLowerCase() === barcodeEq.toLowerCase() || p.variations?.some((v) => v.barcode?.toLowerCase() === barcodeEq.toLowerCase())))
          );
        } else {
          const firstTermOr = args.where?.OR?.[0] as { name?: { contains?: string } } | undefined;
          const rawTerm = firstTermOr?.name?.contains || "";
          const tokens = tokenizeQuery(rawTerm);
          if (tokens.length > 0) {
            result = result.filter((p) => {
              const doc = searchDocs.find((d) => d.productId === p.id);
              return doc ? tokens.every((t) => doc.searchTextNormalized.includes(t)) : false;
            });
          }
        }
      }

      return result as unknown as Awaited<ReturnType<typeof prisma.product.findMany>>;
    }
  );
}

interface MatrixTestCase {
  id: string;
  description: string;
  input: {
    search?: string;
    page: number;
    perPage: number;
  };
  expectedIds: string[];
  forbiddenIds?: string[];
}

const SEED_MATRIX_TEST_CASES: MatrixTestCase[] = [
  {
    id: "M-01",
    description: "Pesquisa comercial por 'mel'",
    input: { search: "mel", page: 1, perPage: 50 },
    expectedIds: ["prod-golden-1", "prod-golden-2"],
    forbiddenIds: ["prod-golden-3", "prod-golden-6"],
  },
  {
    id: "M-02",
    description: "Pesquisa comercial por 'mel silvestre'",
    input: { search: "mel silvestre", page: 1, perPage: 50 },
    expectedIds: ["prod-golden-1"],
    forbiddenIds: ["prod-golden-2"],
  },
  {
    id: "M-03",
    description: "Pesquisa comercial por 'cachaca'",
    input: { search: "cachaca", page: 1, perPage: 50 },
    expectedIds: ["prod-golden-3", "prod-golden-4", "prod-golden-5", "prod-golden-multi-var"],
    forbiddenIds: ["prod-golden-1", "prod-golden-6"],
  },
  {
    id: "M-04",
    description: "Pesquisa comercial por 'cachaca amburana'",
    input: { search: "cachaca amburana", page: 1, perPage: 50 },
    expectedIds: ["prod-golden-3", "prod-golden-multi-var"],
    forbiddenIds: ["prod-golden-4", "prod-golden-5"],
  },
  {
    id: "M-05",
    description: "Pesquisa comercial por 'queijo canastra'",
    input: { search: "queijo canastra", page: 1, perPage: 50 },
    expectedIds: ["prod-golden-6"],
    forbiddenIds: ["prod-golden-1", "prod-golden-3"],
  },
  {
    id: "M-06",
    description: "Pesquisa por produtor 'boa esperanca'",
    input: { search: "boa esperanca", page: 1, perPage: 50 },
    expectedIds: ["prod-golden-3", "prod-golden-4", "prod-golden-5", "prod-golden-multi-var"],
    forbiddenIds: ["prod-golden-1"],
  },
  {
    id: "M-07",
    description: "Pesquisa por marca 'serra verde'",
    input: { search: "serra verde", page: 1, perPage: 50 },
    expectedIds: ["prod-golden-1", "prod-golden-2"],
    forbiddenIds: ["prod-golden-3"],
  },
  {
    id: "M-08",
    description: "Pesquisa por loja 'doces da vovo'",
    input: { search: "doces da vovo", page: 1, perPage: 50 },
    expectedIds: ["prod-golden-7", "prod-golden-8", "prod-golden-9", "prod-golden-10"],
    forbiddenIds: ["prod-golden-1"],
  },
  {
    id: "M-09",
    description: "Pesquisa por madeira 'amburana'",
    input: { search: "amburana", page: 1, perPage: 50 },
    expectedIds: ["prod-golden-3", "prod-golden-multi-var"],
    forbiddenIds: ["prod-golden-4"],
  },
  {
    id: "M-10",
    description: "Pesquisa por madeira 'carvalho'",
    input: { search: "carvalho", page: 1, perPage: 50 },
    expectedIds: ["prod-golden-4", "prod-golden-multi-var"],
    forbiddenIds: ["prod-golden-3"],
  },
  {
    id: "M-11",
    description: "Pesquisa por florada 'eucalipto'",
    input: { search: "eucalipto", page: 1, perPage: 50 },
    expectedIds: ["prod-golden-2"],
    forbiddenIds: ["prod-golden-1"],
  },
  {
    id: "M-12",
    description: "Pesquisa por fruta 'jabuticaba'",
    input: { search: "jabuticaba", page: 1, perPage: 50 },
    expectedIds: ["prod-golden-8"],
    forbiddenIds: ["prod-golden-7"],
  },
  {
    id: "M-13",
    description: "Pesquisa por doce 'pacoca'",
    input: { search: "pacoca", page: 1, perPage: 50 },
    expectedIds: ["prod-golden-9"],
    forbiddenIds: ["prod-golden-10"],
  },
  {
    id: "M-14",
    description: "Pesquisa por doce 'pe de moleque'",
    input: { search: "pe de moleque", page: 1, perPage: 50 },
    expectedIds: ["prod-golden-10"],
    forbiddenIds: ["prod-golden-9"],
  },
  {
    id: "M-15",
    description: "Pesquisa por SKU conhecido 'MEL-SILV-500G'",
    input: { search: "MEL-SILV-500G", page: 1, perPage: 50 },
    expectedIds: ["prod-golden-1"],
  },
  {
    id: "M-16",
    description: "Pesquisa por Barcode conhecido '7891234560035'",
    input: { search: "7891234560035", page: 1, perPage: 50 },
    expectedIds: ["prod-golden-3"],
  },
  {
    id: "M-17",
    description: "Pesquisa por termo inexistente 'xyz-inexistente'",
    input: { search: "xyz-inexistente", page: 1, perPage: 50 },
    expectedIds: [],
  },
];

describe("Discovery Quality — Matriz Comercial de Validação (Golden Dataset)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMatrixMocks();
  });

  SEED_MATRIX_TEST_CASES.forEach((tc) => {
    it(`[${tc.id}] ${tc.description}`, async () => {
      const res = await PublicDiscoveryService.discover(tc.input);
      const receivedIds = res.products.map((p) => p.id);

      const missing = tc.expectedIds.filter((id) => !receivedIds.includes(id));
      const forbiddenPresent = (tc.forbiddenIds || []).filter((id) => receivedIds.includes(id));

      if (missing.length > 0 || forbiddenPresent.length > 0) {
        console.error(`
---------------------------------------------------
FALHA MATRIZ DE RELEVÂNCIA [${tc.id}]: ${tc.description}
Input: ${JSON.stringify(tc.input)}
Esperados ausentes: [${missing.join(", ")}]
Proibidos presentes: [${forbiddenPresent.join(", ")}]
Recebidos totais: [${receivedIds.join(", ")}]
---------------------------------------------------`);
      }

      expect(missing).toEqual([]);
      expect(forbiddenPresent).toEqual([]);
    });
  });
});
