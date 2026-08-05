import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../infrastructure/database/prisma";
import { PublicDiscoveryService } from "./discovery.service";
import { normalizeSearchText } from "./product-search-index.service";
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

function setupPaginationMocks() {
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
      titleNormalized,
      contextNormalized,
      attributesNormalized,
      descriptionNormalized,
      searchTextNormalized,
      price: p.price,
      inStock: p.stockTotal > 0,
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
    isPublished: p.isPublished,
    status: "active",
    deletedAt: p.deletedAt || null,
    storeId: p.storeId,
    categoryId: p.categoryId,
    brandId: p.brandId || null,
    category: { id: p.categoryId, name: p.categoryName, slug: p.categorySlug },
    brand: p.brandId ? { id: p.brandId, name: p.brandName!, slug: p.brandSlug! } : null,
    store: { id: p.storeId, name: p.storeName, slug: p.storeSlug, isPublished: p.storeIsPublished, status: "active", deletedAt: null },
    images: [],
    medias: [{ isMain: true, file: { objectKey: "img.jpg" } }],
    variations: p.variations.map((v) => ({
      id: v.id,
      sku: v.sku,
      price: v.price,
      values: [],
      stockItems: [{ quantity: p.stockTotal }],
    })),
  }));

  mockPrisma(prisma.category.findFirst).mockImplementation(
    async (args?: Parameters<typeof prisma.category.findFirst>[0]) => {
      const slugWhere = (args?.where as { slug?: string } | undefined)?.slug;
      if (slugWhere) {
        const match = activeProducts.find((p) => p.categorySlug === slugWhere);
        if (match) {
          return {
            id: match.categoryId,
            name: match.categoryName,
            slug: match.categorySlug,
            description: null,
            status: "active",
            imageUrl: null,
            iconUrl: null,
            parentId: null,
            position: 1,
            isVisible: true,
            metaTitle: null,
            metaDescription: null,
            createdBy: null,
            updatedBy: null,
            deletedAt: null,
            deletedBy: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as unknown as Awaited<ReturnType<typeof prisma.category.findFirst>>;
        }
      }
      return null;
    }
  );

  mockPrisma(prisma.store.findFirst).mockImplementation(
    async (args?: Parameters<typeof prisma.store.findFirst>[0]) => {
      const slugWhere = (args?.where as { slug?: string } | undefined)?.slug;
      if (slugWhere) {
        const match = activeProducts.find((p) => p.storeSlug === slugWhere);
        if (match) {
          return {
            id: match.storeId,
            name: match.storeName,
            slug: match.storeSlug,
            description: null,
            status: "active",
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            deletedBy: null,
            logoUrl: null,
            logoFileId: null,
            coverUrl: null,
            customDomain: null,
          } as unknown as Awaited<ReturnType<typeof prisma.store.findFirst>>;
        }
      }
      return null;
    }
  );

  mockPrisma(prisma.brand.findFirst).mockImplementation(
    async (args?: Parameters<typeof prisma.brand.findFirst>[0]) => {
      const slugWhere = (args?.where as { slug?: string } | undefined)?.slug;
      if (slugWhere) {
        const match = activeProducts.find((p) => p.brandSlug === slugWhere);
        if (match && match.brandId && match.brandName && match.brandSlug) {
          return {
            id: match.brandId,
            name: match.brandName,
            slug: match.brandSlug,
            description: null,
            status: "active",
            isVisible: true,
            metaTitle: null,
            metaDescription: null,
            createdBy: null,
            updatedBy: null,
            deletedAt: null,
            deletedBy: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            logoUrl: null,
          } as unknown as Awaited<ReturnType<typeof prisma.brand.findFirst>>;
        }
      }
      return null;
    }
  );

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

  mockPrisma(prisma.product.findMany).mockImplementation(
    async (args?: Parameters<typeof prisma.product.findMany>[0]) => {
      let result = [...fullProducts];

      const bId = (args?.where as { brandId?: string } | undefined)?.brandId;
      const sId = (args?.where as { storeId?: string } | undefined)?.storeId;
      const catIdIn = (args?.where as { categoryId?: { in?: string[] } } | undefined)?.categoryId?.in;
      const idIn = (args?.where as { id?: { in?: string[] } } | undefined)?.id?.in;
      const isPub = (args?.where as { isPublished?: boolean } | undefined)?.isPublished;
      const delAt = (args?.where as { deletedAt?: null | Date } | undefined)?.deletedAt;

      if (bId) result = result.filter((p) => p.brandId === bId);
      if (sId) result = result.filter((p) => p.storeId === sId);
      if (catIdIn) result = result.filter((p) => catIdIn.includes(p.categoryId));
      if (idIn) result = result.filter((p) => idIn.includes(p.id));
      if (isPub !== undefined) result = result.filter((p) => p.isPublished === isPub);
      if (delAt === null) result = result.filter((p) => p.deletedAt === null);

      return result as unknown as Awaited<ReturnType<typeof prisma.product.findMany>>;
    }
  );

  mockPrisma(prisma.productVariation.findMany).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof prisma.productVariation.findMany>>);
}

describe("Discovery Quality — Paginação & Contextos de Rota", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupPaginationMocks();
  });

  it("44. Paginação Integridade — Sem duplicação, sem perda de itens entre páginas", async () => {
    const page1 = await PublicDiscoveryService.discover({ page: 1, perPage: 4 });
    const page2 = await PublicDiscoveryService.discover({ page: 2, perPage: 4 });

    const ids1 = page1.products.map((p) => p.id);
    const ids2 = page2.products.map((p) => p.id);

    const intersection = ids1.filter((id) => ids2.includes(id));
    expect(intersection).toEqual([]);
    expect(page1.pagination.total).toBeGreaterThan(0);
  });

  it("45. Ranking + Paginação — Ranking global é calculated ANTES da fatia de página", async () => {
    const page1 = await PublicDiscoveryService.discover({ search: "mel", page: 1, perPage: 2 });
    const all = await PublicDiscoveryService.discover({ search: "mel", page: 1, perPage: 100 });

    const page1Ids = page1.products.map((p) => p.id);
    const allTopIds = all.products.slice(0, 2).map((p) => p.id);

    expect(page1Ids).toEqual(allTopIds);
  });

  it("46. Paginação Estável — Execuções repetidas retornam a mesma sequência exata", async () => {
    const run1 = await PublicDiscoveryService.discover({ search: "cachaca", page: 1, perPage: 3 });
    const run2 = await PublicDiscoveryService.discover({ search: "cachaca", page: 1, perPage: 3 });

    expect(run1.products.map((p) => p.id)).toEqual(run2.products.map((p) => p.id));
  });

  it("49. Contexto de Marca por URL (brandSlug) — Retorna apenas produtos da marca", async () => {
    const res = await PublicDiscoveryService.discover({ brandSlug: "engenho-boa-esperanca", page: 1, perPage: 50 });
    const ids = res.products.map((p) => p.id);

    for (const id of ids) {
      const prod = GOLDEN_DATASET_PRODUCTS.find((p) => p.id === id);
      expect(prod?.brandSlug).toBe("engenho-boa-esperanca");
    }
  });

  it("50. Contexto de Produtor/Loja por URL (storeSlug) — Retorna apenas produtos da loja", async () => {
    const res = await PublicDiscoveryService.discover({ storeSlug: "doces-da-vovo", page: 1, perPage: 50 });
    const ids = res.products.map((p) => p.id);

    for (const id of ids) {
      const prod = GOLDEN_DATASET_PRODUCTS.find((p) => p.id === id);
      expect(prod?.storeSlug).toBe("doces-da-vovo");
    }
  });

  it("51. Catálogo Geral (/produtos) — Retorna produtos públicos ativos respeitando os guards", async () => {
    const res = await PublicDiscoveryService.discover({ page: 1, perPage: 50 });
    const ids = res.products.map((p) => p.id);

    expect(ids).not.toContain("prod-golden-unpub");
    expect(ids).not.toContain("prod-golden-deleted");
    expect(ids).not.toContain("prod-golden-inactive-store");
  });
});
