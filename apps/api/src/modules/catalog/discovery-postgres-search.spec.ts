import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../infrastructure/database/prisma";
import { PublicDiscoveryService } from "./discovery.service";
import { normalizeSearchText, ProductSearchIndexService } from "./product-search-index.service";

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
      findMany: vi.fn(),
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
    productSearchDocument: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    productVariation: {
      findMany: vi.fn(),
    },
  },
}));

describe("Product Search Document & Pure Prisma Client (100% Zero Raw SQL)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should normalize search text consistently (accent removal, lowercase, trim)", () => {
    expect(normalizeSearchText("Cachaça Artesanal")).toBe("cachaca artesanal");
    expect(normalizeSearchText("Paçoca")).toBe("pacoca");
    expect(normalizeSearchText("Açúcar")).toBe("acucar");
    expect(normalizeSearchText("Pé de Moleque")).toBe("pe de moleque");
  });

  it("should build and upsert ProductSearchDocument via pure Prisma Client", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue({
      id: "prod-100",
      name: "Cachaça Amburana",
      shortDescription: "Alambique Boa Esperança",
      category: { name: "Cachaças" },
      brand: { name: "Serra Verde" },
      store: { name: "Engenho Boa Esperança" },
      variations: [
        {
          id: "var-1",
          status: "active",
          deletedAt: null,
          values: [{ optionValue: { value: "Madeira Amburana" } }],
        },
      ],
    } as any);

    vi.mocked(prisma.productSearchDocument.upsert).mockResolvedValue({} as any);

    await ProductSearchIndexService.syncProductSearchDocument("prod-100");

    expect(prisma.productSearchDocument.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { productId: "prod-100" },
        create: expect.objectContaining({
          titleNormalized: "cachaca amburana",
          contextNormalized: "cachacas serra verde engenho boa esperanca",
          attributesNormalized: "madeira amburana",
        }),
      }),
    );
  });

  it("should perform Product Discovery search via pure Prisma Client (0 raw SQL)", async () => {
    vi.mocked(prisma.category.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.store.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.brand.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.marketplaceSettings.findFirst).mockResolvedValue({
      outOfStockBehavior: "show_badge",
    } as any);

    vi.mocked(prisma.productVariation.findMany).mockResolvedValue([]);

    vi.mocked(prisma.productSearchDocument.findMany).mockResolvedValue([
      {
        productId: "prod-search-doc-1",
        titleNormalized: "mel silvestre",
        contextNormalized: "mel apiario serra",
        attributesNormalized: "500g",
        descriptionNormalized: "mel puro",
      },
    ] as any);

    vi.mocked(prisma.product.findMany).mockResolvedValue([
      {
        id: "prod-search-doc-1",
        name: "Mel Silvestre 500g",
        slug: "mel-silvestre-500g",
        shortDescription: "Mel puro de florada silvestre",
        type: "simple",
        isFeatured: false,
        status: "active",
        isPublished: true,
        storeId: "store-1",
        categoryId: "cat-1",
        brandId: null,
        store: { id: "store-1", name: "Apiário Serra", slug: "apiario-serra", logoUrl: null },
        category: { id: "cat-1", name: "Mel", slug: "mel" },
        brand: null,
        medias: [],
        variations: [{ id: "var-1", sku: "MEL-500", price: "30.00", values: [] }],
      },
    ] as any);

    vi.mocked(prisma.stockItem.findMany).mockResolvedValue([]);

    const result = await PublicDiscoveryService.discover({
      page: 1,
      perPage: 12,
      search: "mel",
      sort: "relevance",
    });

    expect(prisma.productSearchDocument.findMany).toHaveBeenCalled();
    expect(result.products).toHaveLength(1);
    expect(result.products[0]?.id).toBe("prod-search-doc-1");
  });
});
