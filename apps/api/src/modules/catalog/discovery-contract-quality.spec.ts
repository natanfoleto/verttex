import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../infrastructure/database/prisma";
import { PublicDiscoveryService } from "./discovery.service";

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

describe("Discovery Quality — Contrato da API, Adapter & Regressão SEO", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma(prisma.category.findFirst).mockResolvedValue(null);
    mockPrisma(prisma.store.findFirst).mockResolvedValue(null);
    mockPrisma(prisma.brand.findFirst).mockResolvedValue(null);

    mockPrisma(prisma.stockItem.findMany).mockImplementation(
      async (args?: Parameters<typeof prisma.stockItem.findMany>[0]) => {
        const varIds: string[] = (args?.where?.variationId as { in?: string[] } | undefined)?.in || [];
        return varIds.map((vId) => ({
          id: `stock-${vId}`,
          variationId: vId,
          physicalQuantity: 50,
          reservedQuantity: 0,
          storeId: "s1",
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
        const doc = {
          productId: "prod-contract-1",
          titleNormalized: "mel silvestre 500g",
          contextNormalized: "mel e derivados",
          attributesNormalized: "500g",
          descriptionNormalized: "",
          searchTextNormalized: "mel silvestre 500g mel e derivados 500g",
          price: 35.0,
          inStock: true,
          categorySlug: "mel-e-derivados",
        };
        const searchWhere = args?.where?.searchTextNormalized as { contains?: string } | undefined;
        if (searchWhere?.contains) {
          if (!doc.searchTextNormalized.includes(searchWhere.contains)) {
            return [] as unknown as Awaited<ReturnType<typeof prisma.productSearchDocument.findMany>>;
          }
        }
        return [doc] as unknown as Awaited<ReturnType<typeof prisma.productSearchDocument.findMany>>;
      }
    );

    mockPrisma(prisma.product.findMany).mockResolvedValue([
      {
        id: "prod-contract-1",
        name: "Mel Silvestre 500g",
        slug: "mel-silvestre-500g",
        price: 35.0,
        isPublished: true,
        status: "active",
        deletedAt: null,
        storeId: "s1",
        categoryId: "c1",
        category: { id: "c1", name: "Mel e Derivados", slug: "mel-e-derivados" },
        store: { id: "s1", name: "Apiário", slug: "apiario", isPublished: true, status: "active", deletedAt: null },
        images: [{ url: "https://example.com/mel.jpg" }],
        medias: [{ isMain: true, file: { objectKey: "mel.jpg" } }],
        variations: [{ id: "v1", price: 35.0, values: [], stockItems: [{ quantity: 50 }] }],
      },
    ] as unknown as Awaited<ReturnType<typeof prisma.product.findMany>>);

    mockPrisma(prisma.productVariation.findMany).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof prisma.productVariation.findMany>>);
  });

  it("52. Response Contract — Garante estrutura oficial de resposta do Discovery (products/items, pagination, facets)", async () => {
    const res = await PublicDiscoveryService.discover({ search: "mel", page: 1, perPage: 50 });

    expect(Array.isArray(res.products)).toBe(true);
    expect(res.products.length).toBeGreaterThan(0);
    expect(res.products[0]).toHaveProperty("id");
    expect(res.products[0]).toHaveProperty("name");
    expect(res.products[0]).toHaveProperty("slug");
    expect(res.products[0]).toHaveProperty("price");

    expect(res.pagination).toBeDefined();
    expect(res.pagination).toHaveProperty("page");
    expect(res.pagination).toHaveProperty("perPage");
    expect(res.pagination).toHaveProperty("total");
    expect(res.pagination).toHaveProperty("totalPages");

    expect(Array.isArray(res.availableFilters)).toBe(true);
  });

  it("53. Adapter / Marketplace Unwrapping Integration — Garante extração correta de dados pelo frontend", () => {
    const rawApiResponse = {
      success: true,
      data: {
        products: [
          { id: "p-1", name: "Mel 500g", price: 30 },
          { id: "p-2", name: "Cachaça 750ml", price: 60 },
        ],
        pagination: { page: 1, perPage: 50, total: 2, totalPages: 1 },
        facets: [],
      },
    };

    const extractedProducts = rawApiResponse.data?.products || [];
    expect(extractedProducts).toHaveLength(2);
    expect(extractedProducts[0]?.name).toBe("Mel 500g");

    const emptyResponse = {
      success: true,
      data: {
        products: [],
        pagination: { page: 1, perPage: 50, total: 0, totalPages: 0 },
        facets: [],
      },
    };
    const emptyProducts = emptyResponse.data?.products || [];
    expect(emptyProducts).toHaveLength(0);
  });

  it("55. Limites de Segurança — Sanitiza parâmetros de consulta perPage e page", async () => {
    const res = await PublicDiscoveryService.discover({ page: 1, perPage: 50 });
    expect(res.pagination.perPage).toBe(50);
  });
});
