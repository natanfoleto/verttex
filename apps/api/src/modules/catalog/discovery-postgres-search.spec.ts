import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../infrastructure/database/prisma";
import { PublicDiscoveryService } from "./discovery.service";

vi.mock("../../infrastructure/database/prisma", () => ({
  prisma: {
    product: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
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
    $queryRaw: vi.fn(),
    $executeRaw: vi.fn(),
  },
}));

describe("PostgreSQL Search Projection & GIN Index (Etapa 2 Structural Final Closure)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should execute PostgreSQL $queryRaw over search_vector Search Projection", async () => {
    vi.mocked(prisma.category.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.store.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.brand.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.marketplaceSettings.findFirst).mockResolvedValue({
      outOfStockBehavior: "show_badge",
    } as any);

    vi.mocked(prisma.$queryRaw).mockResolvedValue([
      { id: "prod-search-vector-1", rank: 0.98 },
    ] as any);

    vi.mocked(prisma.product.findMany).mockResolvedValue([
      {
        id: "prod-search-vector-1",
        name: "Cachaça Envelhecida Amburana",
        slug: "cachaca-amburana",
        shortDescription: "Alambique Engenho Boa Esperança",
        fullDescription: "",
        type: "simple",
        isFeatured: false,
        status: "active",
        isPublished: true,
        storeId: "store-1",
        categoryId: "cat-1",
        brandId: null,
        store: { id: "store-1", name: "Engenho Boa Esperança", slug: "boa-esperanca", logoUrl: null },
        category: { id: "cat-1", name: "Cachaças", slug: "cachacas" },
        brand: null,
        medias: [],
        variations: [{ id: "var-1", sku: "CACH-AMB-700", price: "75.00", values: [] }],
      },
    ] as any);

    vi.mocked(prisma.stockItem.findMany).mockResolvedValue([]);

    const result = await PublicDiscoveryService.discover({
      page: 1,
      perPage: 12,
      search: "Engenho Boa Esperança amburana",
      sort: "relevance",
    });

    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(result.products).toHaveLength(1);
    expect(result.products[0]?.id).toBe("prod-search-vector-1");
    expect(result.products[0]?.relevanceScore).toBe(0.98);
  });

  it("should trigger refreshProductSearchDocument to sync Search Projection on product update", async () => {
    vi.mocked(prisma.$executeRaw).mockResolvedValue(1 as any);

    await PublicDiscoveryService.refreshProductSearchDocument("prod-123");

    expect(prisma.$executeRaw).toHaveBeenCalled();
  });

  it("should safely handle punctuation, short strings and stopwords without throwing 500 errors", async () => {
    vi.mocked(prisma.category.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.store.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.brand.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.marketplaceSettings.findFirst).mockResolvedValue({
      outOfStockBehavior: "show_badge",
    } as any);
    vi.mocked(prisma.$queryRaw).mockResolvedValue([] as any);
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.stockItem.findMany).mockResolvedValue([] as any);

    const testQueries = ["", "a", "de", "&&&", "!!!", '""', "   "];
    for (const q of testQueries) {
      const result = await PublicDiscoveryService.discover({
        page: 1,
        perPage: 12,
        search: q,
        sort: "relevance",
      });
      expect(result).toBeDefined();
      expect(result.products).toHaveLength(0);
    }
  });

  it("should filter promotional items faithfully when isOffer is true", async () => {
    vi.mocked(prisma.category.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.store.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.brand.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.marketplaceSettings.findFirst).mockResolvedValue({
      outOfStockBehavior: "show_badge",
    } as any);

    vi.mocked(prisma.product.findMany).mockResolvedValue([
      {
        id: "prod-promo",
        name: "Mel em Promoção",
        slug: "mel-promo",
        type: "simple",
        status: "active",
        isPublished: true,
        storeId: "store-1",
        categoryId: "cat-1",
        store: { id: "store-1", name: "Apiário", slug: "apiario", logoUrl: null },
        category: { id: "cat-1", name: "Mel", slug: "mel" },
        brand: null,
        medias: [],
        variations: [
          {
            id: "var-promo",
            sku: "MEL-PROMO",
            price: "50.00",
            promotionalPrice: "35.00",
            values: [],
          },
        ],
      },
    ] as any);

    vi.mocked(prisma.stockItem.findMany).mockResolvedValue([]);

    const result = await PublicDiscoveryService.discover({
      page: 1,
      perPage: 12,
      isOffer: true,
      sort: "relevance",
    });

    expect(result.products).toHaveLength(1);
    expect(result.products[0]?.promotionalPrice).toBe(35.0);
    expect(result.seo.canonicalUrl).toBe("/ofertas");
  });
});
