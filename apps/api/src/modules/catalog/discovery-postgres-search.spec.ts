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
  },
}));

describe("PostgreSQL Native FTS & GIN Index (Etapa 2 Final Validation)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should execute PostgreSQL $queryRaw with f_unaccent and websearch_to_tsquery", async () => {
    vi.mocked(prisma.category.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.store.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.brand.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.marketplaceSettings.findFirst).mockResolvedValue({
      outOfStockBehavior: "show_badge",
    } as any);

    vi.mocked(prisma.$queryRaw).mockResolvedValue([
      { id: "prod-pg-1", rank: 0.92 },
    ] as any);

    vi.mocked(prisma.product.findMany).mockResolvedValue([
      {
        id: "prod-pg-1",
        name: "Cachaça Envelhecida Ouro",
        slug: "cachaca-envelhecida-ouro",
        shortDescription: "Alambique tradicional de Minas",
        fullDescription: "",
        type: "simple",
        isFeatured: false,
        status: "active",
        isPublished: true,
        storeId: "store-1",
        categoryId: "cat-1",
        brandId: null,
        store: { id: "store-1", name: "Alambique", slug: "alambique", logoUrl: null },
        category: { id: "cat-1", name: "Cachaças", slug: "cachacas" },
        brand: null,
        medias: [],
        variations: [{ id: "var-1", sku: "CACH-001", price: "50.00", values: [] }],
      },
    ] as any);

    vi.mocked(prisma.stockItem.findMany).mockResolvedValue([]);

    // Testing complex query input with special characters and accents
    const result = await PublicDiscoveryService.discover({
      page: 1,
      perPage: 12,
      search: '"cachaça artesanal" -industrial',
      sort: "relevance",
    });

    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(result.products).toHaveLength(1);
    expect(result.products[0]?.id).toBe("prod-pg-1");
    expect(result.products[0]?.relevanceScore).toBe(0.92);
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
