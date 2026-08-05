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

function setupGuardsMocks(outOfStockBehavior: "show_badge" | "hide_product" | "move_to_end" = "show_badge") {
  const searchDocs = GOLDEN_DATASET_PRODUCTS.map((p) => {
    const titleNormalized = normalizeSearchText(p.name);
    const contextNormalized = normalizeSearchText(`${p.categoryName} ${p.brandName || ""} ${p.storeName}`);
    const attributesNormalized = p.attributes.map((a) => normalizeSearchText(a.value)).join(" ");
    const descriptionNormalized = normalizeSearchText(p.description);
    const searchTextNormalized = `${titleNormalized} ${contextNormalized} ${attributesNormalized} ${descriptionNormalized}`;

    return {
      productId: p.id,
      sku: p.sku,
      titleNormalized,
      contextNormalized,
      attributesNormalized,
      descriptionNormalized,
      searchTextNormalized,
      price: p.price,
      promotionalPrice: p.promotionalPrice || null,
      isOffer: Boolean(p.promotionalPrice && p.promotionalPrice < p.price),
      isFeatured: p.isFeatured,
      inStock: p.stockTotal > 0 && !p.hasExpiredStockOnly && !p.hasQuarantineStockOnly,
      categoryId: p.categoryId,
      categorySlug: p.categorySlug,
      brandId: p.brandId || null,
      brandSlug: p.brandSlug || null,
      storeId: p.storeId,
      storeSlug: p.storeSlug,
    };
  });

  const fullProducts = GOLDEN_DATASET_PRODUCTS.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    promotionalPrice: p.promotionalPrice || null,
    isPublished: p.isPublished,
    status: "active",
    deletedAt: p.deletedAt || null,
    storeId: p.storeId,
    categoryId: p.categoryId,
    brandId: p.brandId || null,
    category: { id: p.categoryId, name: p.categoryName, slug: p.categorySlug },
    brand: p.brandId ? { id: p.brandId, name: p.brandName!, slug: p.brandSlug! } : null,
    store: { id: p.storeId, name: p.storeName, slug: p.storeSlug, isPublished: p.storeIsPublished, status: p.storeIsPublished ? "active" : "inactive", deletedAt: null },
    images: [],
    medias: [{ isMain: true, file: { objectKey: "img.jpg" } }],
    variations: p.variations.map((v) => ({
      id: v.id,
      sku: v.sku,
      price: v.price,
      promotionalPrice: p.promotionalPrice || null,
      values: [],
      stockItems: [
        {
          quantity: p.stockTotal,
          lot: {
            expiresAt: p.hasExpiredStockOnly ? new Date("2020-01-01") : new Date("2028-01-01"),
            status: p.hasQuarantineStockOnly ? "QUARANTINE" : "AVAILABLE",
          },
        },
      ],
    })),
  }));

  mockPrisma(prisma.category.findFirst).mockResolvedValue(null);
  mockPrisma(prisma.store.findFirst).mockResolvedValue(null);
  mockPrisma(prisma.brand.findFirst).mockResolvedValue(null);

  mockPrisma(prisma.stockItem.findMany).mockImplementation(
    async (args?: Parameters<typeof prisma.stockItem.findMany>[0]) => {
      const varIds: string[] = (args?.where?.variationId as { in?: string[] } | undefined)?.in || [];
      return varIds.map((vId) => {
        const parentProd = fullProducts.find((p) => p.variations.some((v) => v.id === vId));
        const hasExpired = parentProd?.id === "prod-golden-expired-stock";
        const isQuarantine = parentProd?.id === "prod-golden-quarantine-stock";
        const isShortShelfLife = parentProd?.id === "prod-golden-shelflife-stock";

        let expirationDate = new Date("2028-01-01");
        if (hasExpired) {
          expirationDate = new Date("2020-01-01");
        } else if (isShortShelfLife) {
          expirationDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 dias (< 15 minDeliveryDays)
        }

        return {
          id: `stock-${vId}`,
          variationId: vId,
          physicalQuantity: parentProd?.id === "prod-golden-out-of-stock" ? 0 : 100,
          reservedQuantity: 0,
          storeId: parentProd?.storeId || "store-apiario-serra",
          location: { status: "active" },
          lot: {
            status: isQuarantine ? "QUARANTINE" : "AVAILABLE",
            expirationDate,
          },
        };
      }) as unknown as Awaited<ReturnType<typeof prisma.stockItem.findMany>>;
    }
  );

  mockPrisma(prisma.marketplaceSettings.findFirst).mockResolvedValue({
    id: "settings-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    bannerPosition: "NO_DISPLAY",
    outOfStockBehavior,
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

  mockPrisma(prisma.product.findMany).mockImplementation(
    async (args?: Parameters<typeof prisma.product.findMany>[0]) => {
      let result = [...fullProducts];
      const w = args?.where as {
        isPublished?: boolean;
        deletedAt?: null | Date;
        variations?: { some?: { promotionalPrice?: { not?: null } } };
        store?: { isPublished?: boolean };
        id?: { in?: string[] };
        OR?: Array<{ name?: { contains?: string } }>;
      } | undefined;

      if (w) {
        if (w.isPublished !== undefined) {
          result = result.filter((p) => p.isPublished === w.isPublished);
        }
        if (w.deletedAt === null) {
          result = result.filter((p) => p.deletedAt === null);
        }
        if (w.variations?.some?.promotionalPrice) {
          result = result.filter((p) => p.promotionalPrice && p.promotionalPrice < p.price);
        }
        const storeWhere = w.store as { status?: string; isPublished?: boolean } | undefined;
        if (storeWhere?.status !== undefined) {
          result = result.filter((p) => p.store.status === storeWhere.status);
        }
        if (w.id?.in) {
          const ids: string[] = w.id.in;
          result = result.filter((p) => ids.includes(p.id));
        }
        if (w.OR && Array.isArray(w.OR)) {
          const firstOr = w.OR[0] as { sku?: { equals?: string } } | undefined;
          const secondOr = w.OR[1] as { barcode?: { equals?: string } } | undefined;
          const skuEq = firstOr?.sku?.equals;
          const barcodeEq = secondOr?.barcode?.equals;

          if (skuEq || barcodeEq) {
            result = result.filter(
              (p: any) =>
                (skuEq && (p.sku?.toLowerCase() === skuEq.toLowerCase() || p.variations?.some((v: any) => v.sku?.toLowerCase() === skuEq.toLowerCase()))) ||
                (barcodeEq && (p.barcode?.toLowerCase() === barcodeEq.toLowerCase() || p.variations?.some((v: any) => v.barcode?.toLowerCase() === barcodeEq.toLowerCase())))
            );
          } else {
            const firstTermOr = w.OR[0] as { name?: { contains?: string } } | undefined;
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
      }
      return result as unknown as Awaited<ReturnType<typeof prisma.product.findMany>>;
    }
  );

  mockPrisma(prisma.productVariation.findMany).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof prisma.productVariation.findMany>>);
}

describe("Discovery Quality — Guards de Negócio, Preço, Ofertas & Estoque", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupGuardsMocks();
  });

  it("30. Filtro de Preço Mínimo e Máximo (minPrice & maxPrice)", async () => {
    const res = await PublicDiscoveryService.discover({ minPrice: 30, maxPrice: 50, page: 1, perPage: 50 });
    const prices = res.products.map((p) => p.price);

    for (const price of prices) {
      expect(price).toBeGreaterThanOrEqual(30);
      expect(price).toBeLessThanOrEqual(50);
    }
  });

  it("31. Ordenação Explícita por Preço (price_asc e price_desc)", async () => {
    const resAsc = await PublicDiscoveryService.discover({ sort: "price_asc", page: 1, perPage: 50 });
    const pricesAsc = resAsc.products.map((p) => p.promotionalPrice || p.price);
    const sortedAsc = [...pricesAsc].sort((a, b) => a - b);
    expect(pricesAsc).toEqual(sortedAsc);

    const resDesc = await PublicDiscoveryService.discover({ sort: "price_desc", page: 1, perPage: 50 });
    const pricesDesc = resDesc.products.map((p) => p.promotionalPrice || p.price);
    const sortedDesc = [...pricesDesc].sort((a, b) => b - a);
    expect(pricesDesc).toEqual(sortedDesc);
  });

  it("32. Ofertas — Apenas produtos com promotionalPrice < price e ativo", async () => {
    const res = await PublicDiscoveryService.discover({ isOffer: true, page: 1, perPage: 50 });
    const ids = res.products.map((p) => p.id);

    expect(ids).toContain("prod-golden-1");
    expect(ids).toContain("prod-golden-3");
    expect(ids).not.toContain("prod-golden-2");
  });

  it("33. Busca + Ofertas — Interseção de palavra 'mel' em /ofertas", async () => {
    const res = await PublicDiscoveryService.discover({ search: "mel", isOffer: true, page: 1, perPage: 50 });
    const ids = res.products.map((p) => p.id);

    expect(ids).toContain("prod-golden-1");
    expect(ids).not.toContain("prod-golden-3");
  });

  it("34. GUARD: Produto NÃO publicado (isPublished: false) NUNCA deve aparecer", async () => {
    const res = await PublicDiscoveryService.discover({ search: "Jataí", page: 1, perPage: 50 });
    const ids = res.products.map((p) => p.id);

    if (ids.includes("prod-golden-unpub")) {
      console.error("FALHA DE GUARD: Produto não publicado 'prod-golden-unpub' apareceu na busca!");
    }
    expect(ids).not.toContain("prod-golden-unpub");
  });

  it("35. GUARD: Produto Arquivado/Deletado (deletedAt != null) NUNCA deve aparecer", async () => {
    const res = await PublicDiscoveryService.discover({ search: "Bracatinga", page: 1, perPage: 50 });
    const ids = res.products.map((p) => p.id);

    if (ids.includes("prod-golden-deleted")) {
      console.error("FALHA DE GUARD: Produto deletado 'prod-golden-deleted' apareceu na busca!");
    }
    expect(ids).not.toContain("prod-golden-deleted");
  });

  it("36. GUARD: Loja/Produtor Inativo (storeIsPublished: false) NUNCA deve aparecer", async () => {
    const res = await PublicDiscoveryService.discover({ search: "Produtor Inativo", page: 1, perPage: 50 });
    const ids = res.products.map((p) => p.id);

    if (ids.includes("prod-golden-inactive-store")) {
      console.error("FALHA DE GUARD: Produto de loja inativa 'prod-golden-inactive-store' apareceu na busca!");
    }
    expect(ids).not.toContain("prod-golden-inactive-store");
  });

  it("37. GUARD: Produto com apenas lote em quarentena deve ser tratado como indisponível", async () => {
    const res = await PublicDiscoveryService.discover({ search: "Quarentena", page: 1, perPage: 50 });
    const prod = res.products.find((p) => p.id === "prod-golden-quarantine-stock");

    expect(prod).toBeDefined();
    expect(prod?.isAvailable).toBe(false);
  });

  it("38. GUARD: Produto com apenas lote abaixo da shelf-life mínima (< 15 dias) deve ser tratado como indisponível", async () => {
    const res = await PublicDiscoveryService.discover({ search: "Shelf Life", page: 1, perPage: 50 });
    const prod = res.products.find((p) => p.id === "prod-golden-shelflife-stock");

    expect(prod).toBeDefined();
    expect(prod?.isAvailable).toBe(false);
  });

  it("39. GUARD: Produto com apenas lote vencido deve ser tratado como indisponível", async () => {
    const res = await PublicDiscoveryService.discover({ search: "Lote Vencido", page: 1, perPage: 50 });
    const prod = res.products.find((p) => p.id === "prod-golden-expired-stock");

    expect(prod).toBeDefined();
    expect(prod?.isAvailable).toBe(false);
  });

  it("40. outOfStockBehavior = show_badge mantém produto sem estoque na lista mas com isAvailable: false", async () => {
    setupGuardsMocks("show_badge");
    const res = await PublicDiscoveryService.discover({ search: "Doce de Leite Tradicional Esgotado", page: 1, perPage: 50 });
    const prod = res.products.find((p) => p.id === "prod-golden-out-of-stock");

    expect(prod).toBeDefined();
    expect(prod?.isAvailable).toBe(false);
  });

  it("41. outOfStockBehavior = move_to_end reordena produtos indisponíveis para o final do resultado", async () => {
    setupGuardsMocks("move_to_end");
    const res = await PublicDiscoveryService.discover({ page: 1, perPage: 50 });
    const products = res.products;

    const availableIndices = products
      .map((p, idx) => (p.isAvailable ? idx : -1))
      .filter((idx) => idx !== -1);
    const unavailableIndices = products
      .map((p, idx) => (!p.isAvailable ? idx : -1))
      .filter((idx) => idx !== -1);

    if (availableIndices.length > 0 && unavailableIndices.length > 0) {
      const maxAvailableIdx = Math.max(...availableIndices);
      const minUnavailableIdx = Math.min(...unavailableIndices);
      expect(minUnavailableIdx).toBeGreaterThan(maxAvailableIdx);
    }
  });

  it("43. outOfStockBehavior = hide_product esconde produtos sem estoque", async () => {
    setupGuardsMocks("hide_product");
    const res = await PublicDiscoveryService.discover({ search: "Doce de Leite Tradicional Esgotado", page: 1, perPage: 50 });
    const ids = res.products.map((p) => p.id);

    expect(ids).not.toContain("prod-golden-out-of-stock");
  });
});

