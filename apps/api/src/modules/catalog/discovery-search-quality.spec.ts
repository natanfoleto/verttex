import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../infrastructure/database/prisma";
import { PublicDiscoveryService } from "./discovery.service";
import { normalizeSearchText, tokenizeQuery } from "./product-search-index.service";
import { GOLDEN_DATASET_PRODUCTS } from "./discovery-golden-dataset.fixture";

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

function setupGoldenDatasetMocks() {
  const activeProducts = GOLDEN_DATASET_PRODUCTS.filter(
    (p) => p.isPublished && !p.deletedAt && p.storeIsPublished
  );

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
    images: [{ url: "https://example.com/img.jpg", isPrimary: true }],
    medias: [{ isMain: true, file: { objectKey: "img.jpg" } }],
    variations: p.variations.map((v) => ({
      id: v.id,
      sku: v.sku,
      barcode: v.barcode || null,
      price: v.price,
      values: Object.entries(v.attributes || {}).map(([key, val]) => ({
        optionValue: { option: { name: key }, value: val },
      })),
      stockItems: [{ quantity: p.stockTotal, lot: { expiresAt: new Date("2028-01-01"), status: "AVAILABLE" } }],
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
      const catSlug = (args?.where as { categorySlug?: string } | undefined)?.categorySlug;
      const bSlug = (args?.where as { brandSlug?: string } | undefined)?.brandSlug;
      const sSlug = (args?.where as { storeSlug?: string } | undefined)?.storeSlug;
      if (catSlug) result = result.filter((d) => d.categorySlug === catSlug);
      if (bSlug) result = result.filter((d) => d.brandSlug === bSlug);
      if (sSlug) result = result.filter((d) => d.storeSlug === sSlug);
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
                (skuTerm && (v.sku?.toLowerCase() === skuTerm.toLowerCase() || p.sku?.toLowerCase() === skuTerm.toLowerCase())) ||
                (barcodeTerm && (v.barcode?.toLowerCase() === barcodeTerm.toLowerCase() || p.barcode?.toLowerCase() === barcodeTerm.toLowerCase()))
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

function assertExpectedSearchResult(
  query: string,
  receivedIds: string[],
  expectedIds: string[],
  forbiddenIds: string[] = []
) {
  const missingExpected = expectedIds.filter((id) => !receivedIds.includes(id));
  const unexpectedForbidden = receivedIds.filter((id) => forbiddenIds.includes(id));

  if (missingExpected.length > 0 || unexpectedForbidden.length > 0) {
    const errorDetails = `
---------------------------------------------------
FALHA DE QUALIDADE DE BUSCA:
Query: "${query}"
Esperados ausentes: [${missingExpected.join(", ")}]
Proibidos presentes: [${unexpectedForbidden.join(", ")}]
Recebidos totais: [${receivedIds.join(", ")}]
---------------------------------------------------`;
    console.error(errorDetails);
  }

  expect(missingExpected).toEqual([]);
  expect(unexpectedForbidden).toEqual([]);
}

describe("Discovery Quality — Busca Simples & Termos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupGoldenDatasetMocks();
  });

  it("5. Busca simples 'mel' traz apenas produtos de mel e proíbe produtos não relacionados", async () => {
    const res = await PublicDiscoveryService.discover({ search: "mel", page: 1, perPage: 50 });
    const receivedIds = res.products.map((p) => p.id);

    assertExpectedSearchResult(
      "mel",
      receivedIds,
      ["prod-golden-1", "prod-golden-2"],
      ["prod-golden-3", "prod-golden-6", "prod-golden-7"]
    );
  });

  it("5. Busca simples 'cachaca' traz apenas cachaças artesanais", async () => {
    const res = await PublicDiscoveryService.discover({ search: "cachaca", page: 1, perPage: 50 });
    const receivedIds = res.products.map((p) => p.id);

    assertExpectedSearchResult(
      "cachaca",
      receivedIds,
      ["prod-golden-3", "prod-golden-4", "prod-golden-5"],
      ["prod-golden-1", "prod-golden-6", "prod-golden-9"]
    );
  });

  it("6. Case Insensitive — 'MEL', 'Mel' e 'mel' devem retornar os mesmos produtos", async () => {
    const resLower = await PublicDiscoveryService.discover({ search: "mel", page: 1, perPage: 50 });
    const resUpper = await PublicDiscoveryService.discover({ search: "MEL", page: 1, perPage: 50 });
    const resMixed = await PublicDiscoveryService.discover({ search: "Mel", page: 1, perPage: 50 });

    const idsLower = resLower.products.map((p) => p.id);
    const idsUpper = resUpper.products.map((p) => p.id);
    const idsMixed = resMixed.products.map((p) => p.id);

    expect(idsUpper).toEqual(idsLower);
    expect(idsMixed).toEqual(idsLower);
  });

  it("7. Normalização de acentos — 'cachaça' vs 'cachaca'", async () => {
    const resAccented = await PublicDiscoveryService.discover({ search: "cachaça", page: 1, perPage: 50 });
    const resNormalized = await PublicDiscoveryService.discover({ search: "cachaca", page: 1, perPage: 50 });

    const idsAccented = resAccented.products.map((p) => p.id);
    const idsNormalized = resNormalized.products.map((p) => p.id);

    expect(idsAccented).toEqual(idsNormalized);
  });

  it("8. Espaços duplos e extras — '  mel   silvestre  '", async () => {
    const resNormal = await PublicDiscoveryService.discover({ search: "mel silvestre", page: 1, perPage: 50 });
    const resSpaces = await PublicDiscoveryService.discover({ search: "  mel   silvestre  ", page: 1, perPage: 50 });

    expect(resSpaces.products.map((p) => p.id)).toEqual(resNormal.products.map((p) => p.id));
  });

  it("9. Busca multi-termo AND — 'mel silvestre' requer ambos os termos", async () => {
    const res = await PublicDiscoveryService.discover({ search: "mel silvestre", page: 1, perPage: 50 });
    const receivedIds = res.products.map((p) => p.id);

    assertExpectedSearchResult(
      "mel silvestre",
      receivedIds,
      ["prod-golden-1"],
      ["prod-golden-2"]
    );
  });

  it("10. Termos em campos diferentes — 'mel serra' (título + marca/contexto)", async () => {
    const res = await PublicDiscoveryService.discover({ search: "mel serra", page: 1, perPage: 50 });
    const receivedIds = res.products.map((p) => p.id);

    expect(receivedIds).toContain("prod-golden-1");
    expect(receivedIds).toContain("prod-golden-2");
  });

  it("11. Ordem dos termos — 'mel silvestre' vs 'silvestre mel'", async () => {
    const res1 = await PublicDiscoveryService.discover({ search: "mel silvestre", page: 1, perPage: 50 });
    const res2 = await PublicDiscoveryService.discover({ search: "silvestre mel", page: 1, perPage: 50 });

    const ids1 = res1.products.map((p) => p.id);
    const ids2 = res2.products.map((p) => p.id);

    expect(ids2.sort()).toEqual(ids1.sort());
  });

  it("14. Busca por SKU exato — 'MEL-SILV-500G'", async () => {
    const res = await PublicDiscoveryService.discover({ search: "MEL-SILV-500G", page: 1, perPage: 50 });
    expect(res.products.length).toBeGreaterThan(0);
    expect(res.products[0]?.id).toBe("prod-golden-1");
  });

  it("15. Busca por Barcode/GTIN exato — '7891234560035'", async () => {
    const res = await PublicDiscoveryService.discover({ search: "7891234560035", page: 1, perPage: 50 });
    expect(res.products.length).toBeGreaterThan(0);
    expect(res.products[0]?.id).toBe("prod-golden-3");
  });

  it("16. Busca por nome de categoria — 'Mel e Derivados'", async () => {
    const res = await PublicDiscoveryService.discover({ search: "Mel e Derivados", page: 1, perPage: 50 });
    const ids = res.products.map((p) => p.id);
    expect(ids).toContain("prod-golden-1");
    expect(ids).toContain("prod-golden-2");
  });

  it("17. Busca por nome de marca — 'Engenho Boa Esperança'", async () => {
    const res = await PublicDiscoveryService.discover({ search: "Engenho Boa Esperança", page: 1, perPage: 50 });
    const ids = res.products.map((p) => p.id);
    expect(ids).toContain("prod-golden-3");
    expect(ids).toContain("prod-golden-4");
    expect(ids).toContain("prod-golden-5");
  });

  it("18. Busca por nome de produtor/loja — 'Doces da Vovó'", async () => {
    const res = await PublicDiscoveryService.discover({ search: "Doces da Vovó", page: 1, perPage: 50 });
    const ids = res.products.map((p) => p.id);
    expect(ids).toContain("prod-golden-7");
    expect(ids).toContain("prod-golden-8");
    expect(ids).toContain("prod-golden-9");
  });

  it("19. Busca por atributo específico — 'amburana'", async () => {
    const res = await PublicDiscoveryService.discover({ search: "amburana", page: 1, perPage: 50 });
    const ids = res.products.map((p) => p.id);
    expect(ids).toContain("prod-golden-3");
    expect(ids).not.toContain("prod-golden-4");
  });

  it("20. Termo presente apenas na descrição", async () => {
    const res = await PublicDiscoveryService.discover({ search: "lenha", page: 1, perPage: 50 });
    const ids = res.products.map((p) => p.id);
    expect(ids).toContain("prod-golden-10");
  });

  it("21. Termo inexistente — 'xyz-inexistente'", async () => {
    const res = await PublicDiscoveryService.discover({ search: "xyz-inexistente", page: 1, perPage: 50 });
    expect(res.products.length).toBe(0);
  });

  it("22. Falsos positivos — 'jabuticaba' não deve trazer cachaças ou mel", async () => {
    const res = await PublicDiscoveryService.discover({ search: "jabuticaba", page: 1, perPage: 50 });
    const ids = res.products.map((p) => p.id);
    assertExpectedSearchResult(
      "jabuticaba",
      ids,
      ["prod-golden-8"],
      ["prod-golden-1", "prod-golden-3", "prod-golden-6"]
    );
  });

  it("23. Deduplicação — produto com múltiplos matches em vários campos deve aparecer uma única vez", async () => {
    const res = await PublicDiscoveryService.discover({ search: "serra verde", page: 1, perPage: 50 });
    const ids = res.products.map((p) => p.id);
    const uniqueIds = Array.from(new Set(ids));
    expect(ids.length).toBe(uniqueIds.length);
  });

  it("24. Produto com múltiplas variantes — deve retornar 1 único produto e não N variantes", async () => {
    const res = await PublicDiscoveryService.discover({ search: "Linha Ouro", page: 1, perPage: 50 });
    const multiVarProducts = res.products.filter((p) => p.id === "prod-golden-multi-var");
    expect(multiVarProducts.length).toBe(1);
  });

  it("25. Query vazia ou com apenas espaços no fluxo público (/busca, /busca?q=, search: '   ')", async () => {
    const resEmpty = await PublicDiscoveryService.discover({ search: "", page: 1, perPage: 50 });
    const resSpaces = await PublicDiscoveryService.discover({ search: "   ", page: 1, perPage: 50 });
    const resUndefined = await PublicDiscoveryService.discover({ page: 1, perPage: 50 });

    expect(resEmpty.products.length).toBeGreaterThan(0);
    expect(resSpaces.products.map((p) => p.id)).toEqual(resEmpty.products.map((p) => p.id));
    expect(resUndefined.products.map((p) => p.id)).toEqual(resEmpty.products.map((p) => p.id));
  });
});

