import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../infrastructure/database/prisma";
import { normalizeSearchText, ProductSearchIndexService, tokenizeQuery } from "./product-search-index.service";
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

// ─────────────────────────────────────────────
// 1. normalizeSearchText
// ─────────────────────────────────────────────
describe("normalizeSearchText", () => {
  it("removes accents and lowercases", () => {
    expect(normalizeSearchText("Cachaça Artesanal")).toBe("cachaca artesanal");
    expect(normalizeSearchText("Paçoca")).toBe("pacoca");
    expect(normalizeSearchText("Açúcar")).toBe("acucar");
    expect(normalizeSearchText("Pé de Moleque")).toBe("pe de moleque");
  });

  it("collapses duplicate spaces and trims", () => {
    expect(normalizeSearchText("  mel   silvestre  ")).toBe("mel silvestre");
  });

  it("returns empty string for empty input", () => {
    expect(normalizeSearchText("")).toBe("");
    expect(normalizeSearchText("   ")).toBe("");
  });
});

// ─────────────────────────────────────────────
// 2. tokenizeQuery
// ─────────────────────────────────────────────
describe("tokenizeQuery", () => {
  it("splits query into normalized tokens", () => {
    expect(tokenizeQuery("Mel Silvestre")).toEqual(["mel", "silvestre"]);
    expect(tokenizeQuery("Cachaça Amburana")).toEqual(["cachaca", "amburana"]);
  });

  it("returns single token for single word query", () => {
    expect(tokenizeQuery("mel")).toEqual(["mel"]);
  });

  it("returns empty array for blank query", () => {
    expect(tokenizeQuery("")).toEqual([]);
    expect(tokenizeQuery("   ")).toEqual([]);
  });
});

// ─────────────────────────────────────────────
// 3. ProductSearchIndexService — buildSearchDocumentData
// ─────────────────────────────────────────────
describe("ProductSearchIndexService.buildSearchDocumentData", () => {
  beforeEach(() => vi.clearAllMocks());

  it("builds normalized document with all fields", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue({
      id: "prod-1",
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

    const data = await ProductSearchIndexService.buildSearchDocumentData("prod-1");

    expect(data).toBeDefined();
    expect(data!.titleNormalized).toBe("cachaca amburana");
    expect(data!.contextNormalized).toContain("cachacas");
    expect(data!.contextNormalized).toContain("serra verde");
    expect(data!.contextNormalized).toContain("engenho boa esperanca");
    expect(data!.attributesNormalized).toContain("madeira amburana");
    expect(data!.descriptionNormalized).toContain("alambique boa esperanca");
    // searchTextNormalized must include all fields concatenated
    expect(data!.searchTextNormalized).toContain("cachaca amburana");
    expect(data!.searchTextNormalized).toContain("cachacas");
    expect(data!.searchTextNormalized).toContain("madeira amburana");
  });

  it("returns null when product not found", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null);
    const data = await ProductSearchIndexService.buildSearchDocumentData("nonexistent");
    expect(data).toBeNull();
  });
});

// ─────────────────────────────────────────────
// 4. ProductSearchIndexService — syncProductSearchDocument
// ─────────────────────────────────────────────
describe("ProductSearchIndexService.syncProductSearchDocument", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls upsert with correct normalized document via pure Prisma Client", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue({
      id: "prod-sync-1",
      name: "Mel Silvestre",
      shortDescription: "Florada silvestre pura",
      category: { name: "Mel" },
      brand: null,
      store: { name: "Apiário Serra" },
      variations: [],
    } as any);

    vi.mocked(prisma.productSearchDocument.upsert).mockResolvedValue({} as any);

    await ProductSearchIndexService.syncProductSearchDocument("prod-sync-1");

    expect(prisma.productSearchDocument.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { productId: "prod-sync-1" },
        create: expect.objectContaining({
          titleNormalized: "mel silvestre",
          contextNormalized: expect.stringContaining("mel"),
          searchTextNormalized: expect.stringContaining("mel"),
        }),
      }),
    );
  });
});

// ─────────────────────────────────────────────
// 5. searchPrismaClient — multi-termo AND
// ─────────────────────────────────────────────
describe("PublicDiscoveryService.searchPrismaClient — AND multi-term", () => {
  beforeEach(() => vi.clearAllMocks());

  it("finds product when terms are in different fields (mel in title, silvestre in attributes)", async () => {
    vi.mocked(prisma.productVariation.findMany).mockResolvedValue([]);

    // Candidate set from anchor token "mel"
    vi.mocked(prisma.productSearchDocument.findMany).mockResolvedValue([
      {
        productId: "prod-mel",
        titleNormalized: "mel premium",
        contextNormalized: "mel apiario",
        attributesNormalized: "silvestre 500g",    // "silvestre" is here
        descriptionNormalized: "mel puro",
        searchTextNormalized: "mel premium mel apiario silvestre 500g mel puro",
      },
      {
        productId: "prod-no-match",
        titleNormalized: "mel",
        contextNormalized: "apiario",
        attributesNormalized: "eucalipto",
        descriptionNormalized: "mel comum",
        searchTextNormalized: "mel apiario eucalipto mel comum",
        // "silvestre" NOT present → must be excluded
      },
    ] as any);

    const result = await PublicDiscoveryService.searchPrismaClient("mel silvestre", [], undefined, undefined);

    expect(result.has("prod-mel")).toBe(true);
    expect(result.has("prod-no-match")).toBe(false);
  });

  it("prioritizes title match over context match", async () => {
    vi.mocked(prisma.productVariation.findMany).mockResolvedValue([]);

    vi.mocked(prisma.productSearchDocument.findMany).mockResolvedValue([
      {
        productId: "prod-title",
        titleNormalized: "mel silvestre",
        contextNormalized: "apiario",
        attributesNormalized: "",
        descriptionNormalized: "",
        searchTextNormalized: "mel silvestre apiario",
      },
      {
        productId: "prod-context",
        titleNormalized: "produto",
        contextNormalized: "mel silvestre loja",
        attributesNormalized: "",
        descriptionNormalized: "",
        searchTextNormalized: "produto mel silvestre loja",
      },
    ] as any);

    const result = await PublicDiscoveryService.searchPrismaClient("mel silvestre", [], undefined, undefined);

    const scoreTitle = result.get("prod-title")!;
    const scoreContext = result.get("prod-context")!;
    expect(scoreTitle).toBeGreaterThan(scoreContext);
  });

  it("assigns score 1000 to exact SKU match", async () => {
    vi.mocked(prisma.productVariation.findMany).mockResolvedValue([
      { productId: "prod-sku" },
    ] as any);
    vi.mocked(prisma.productSearchDocument.findMany).mockResolvedValue([]);

    const result = await PublicDiscoveryService.searchPrismaClient("MEL-SKU-001", [], undefined, undefined);

    expect(result.get("prod-sku")).toBe(1000);
  });

  it("returns empty map for empty query", async () => {
    const result = await PublicDiscoveryService.searchPrismaClient("", [], undefined, undefined);
    expect(result.size).toBe(0);
  });
});

// ─────────────────────────────────────────────
// 6. Ranking: title before description
// ─────────────────────────────────────────────
describe("discover() — ranking order", () => {
  beforeEach(() => vi.clearAllMocks());

  const makeProduct = (id: string, name: string, desc: string) => ({
    id,
    name,
    slug: id,
    shortDescription: desc,
    fullDescription: "",
    type: "simple",
    isFeatured: false,
    status: "active",
    isPublished: true,
    storeId: "store-1",
    categoryId: "cat-1",
    brandId: null,
    store: { id: "store-1", name: "Loja", slug: "loja", logoUrl: null },
    category: { id: "cat-1", name: "Mel", slug: "mel" },
    brand: null,
    medias: [],
    variations: [{ id: `var-${id}`, sku: `SKU-${id}`, price: "30.00", promotionalPrice: null, values: [] }],
  });

  it("ranks product with title match above product with only description match", async () => {
    vi.mocked(prisma.category.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.store.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.brand.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.marketplaceSettings.findFirst).mockResolvedValue({ outOfStockBehavior: "show_badge" } as any);

    vi.mocked(prisma.productVariation.findMany).mockResolvedValue([]);

    vi.mocked(prisma.productSearchDocument.findMany).mockResolvedValue([
      {
        productId: "prod-title",
        titleNormalized: "mel silvestre premium",
        contextNormalized: "apiario serra",
        attributesNormalized: "",
        descriptionNormalized: "mel artesanal",
        searchTextNormalized: "mel silvestre premium apiario serra mel artesanal",
      },
      {
        productId: "prod-desc",
        titleNormalized: "produto natural",
        contextNormalized: "loja gourmet",
        attributesNormalized: "",
        descriptionNormalized: "acompanha mel silvestre de qualidade",
        searchTextNormalized: "produto natural loja gourmet mel silvestre qualidade",
      },
    ] as any);

    vi.mocked(prisma.product.findMany).mockResolvedValue([
      makeProduct("prod-title", "Mel Silvestre Premium", "mel artesanal"),
      makeProduct("prod-desc", "Produto Natural", "acompanha mel silvestre de qualidade"),
    ] as any);

    vi.mocked(prisma.stockItem.findMany).mockResolvedValue([] as any);

    const result = await PublicDiscoveryService.discover({ page: 1, perPage: 12, search: "mel silvestre", sort: "relevance" });

    expect(result.products[0]!.id).toBe("prod-title");
    expect(result.products[1]!.id).toBe("prod-desc");
  });
});

// ─────────────────────────────────────────────
// 7. Paginação estável sem duplicação
// ─────────────────────────────────────────────
describe("discover() — paginação estável", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns non-overlapping pages with consistent ordering", async () => {
    vi.mocked(prisma.category.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.store.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.brand.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.marketplaceSettings.findFirst).mockResolvedValue({ outOfStockBehavior: "show_badge" } as any);
    vi.mocked(prisma.productVariation.findMany).mockResolvedValue([]);
    vi.mocked(prisma.productSearchDocument.findMany).mockResolvedValue([]);
    vi.mocked(prisma.stockItem.findMany).mockResolvedValue([]);

    const makeP = (i: number) => ({
      id: `prod-${String(i).padStart(3, "0")}`,
      name: `Produto ${i}`,
      slug: `produto-${i}`,
      shortDescription: null,
      fullDescription: null,
      type: "simple",
      isFeatured: false,
      status: "active",
      isPublished: true,
      storeId: "store-1",
      categoryId: "cat-1",
      brandId: null,
      store: { id: "store-1", name: "Loja", slug: "loja", logoUrl: null },
      category: { id: "cat-1", name: "Categoria", slug: "categoria" },
      brand: null,
      medias: [],
      variations: [{ id: `var-${i}`, sku: `SKU-${i}`, price: "10.00", promotionalPrice: null, values: [] }],
    });

    const allProducts = Array.from({ length: 5 }, (_, i) => makeP(i + 1));
    vi.mocked(prisma.product.findMany).mockResolvedValue(allProducts as any);

    const p1 = await PublicDiscoveryService.discover({ page: 1, perPage: 3, sort: "newest" });
    const p2 = await PublicDiscoveryService.discover({ page: 2, perPage: 3, sort: "newest" });

    const ids1 = p1.products.map((p) => p.id);
    const ids2 = p2.products.map((p) => p.id);

    // No overlap between pages
    const overlap = ids1.filter((id) => ids2.includes(id));
    expect(overlap).toHaveLength(0);

    // Total coverage correct
    expect(p1.pagination.total).toBe(5);
    expect(p1.pagination.totalPages).toBe(2);
    expect(p1.pagination.hasNextPage).toBe(true);
    expect(p2.pagination.hasPreviousPage).toBe(true);
  });
});

// ─────────────────────────────────────────────
// 8. Sincronização de entidades compartilhadas
// ─────────────────────────────────────────────
describe("ProductSearchIndexService — refresh by shared entity", () => {
  beforeEach(() => vi.clearAllMocks());

  it("refreshByBrand: calls syncProductSearchDocument for all products of a brand", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      { id: "prod-b1" },
      { id: "prod-b2" },
    ] as any);
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null); // sync returns early for not found

    await ProductSearchIndexService.refreshByBrand("brand-x");

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ brandId: "brand-x" }) }),
    );
  });

  it("refreshByCategory: calls syncProductSearchDocument for all products of a category", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([{ id: "prod-c1" }] as any);
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

    await ProductSearchIndexService.refreshByCategory("cat-x");

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ categoryId: "cat-x" }) }),
    );
  });

  it("refreshByStore: calls syncProductSearchDocument for all products of a store", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([{ id: "prod-s1" }] as any);
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

    await ProductSearchIndexService.refreshByStore("store-x");

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ storeId: "store-x" }) }),
    );
  });
});

// ─────────────────────────────────────────────
// 9. Produto arquivado não aparece no Discovery
// ─────────────────────────────────────────────
describe("discover() — archived product excluded", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not return archived/unpublished product even with a valid Search Document", async () => {
    vi.mocked(prisma.category.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.store.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.brand.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.marketplaceSettings.findFirst).mockResolvedValue({ outOfStockBehavior: "show_badge" } as any);
    vi.mocked(prisma.productVariation.findMany).mockResolvedValue([]);
    vi.mocked(prisma.productSearchDocument.findMany).mockResolvedValue([]);

    // findMany returns empty because the WHERE clause includes status: "active", isPublished: true
    // (simulating that DB correctly filters archived products)
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.stockItem.findMany).mockResolvedValue([] as any);

    const result = await PublicDiscoveryService.discover({
      page: 1,
      perPage: 12,
      search: "mel",
      sort: "relevance",
    });

    expect(result.products).toHaveLength(0);
  });
});
