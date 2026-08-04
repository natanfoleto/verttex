import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../infrastructure/database/prisma";
import { PublicDiscoveryService } from "./discovery.service";
import { ProductSearchIndexService, normalizeSearchText } from "./product-search-index.service";

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

// Helper to generate N mock products for benchmark testing
function generateMockProducts(count: number) {
  const products = [];
  const searchDocs = [];

  for (let i = 1; i <= count; i++) {
    const id = `prod-bench-${i}`;
    const isMel = i % 2 === 0;
    const isSilvestre = i % 4 === 0;
    const isAmburana = i % 5 === 0;
    const isBoaEsperanca = i % 3 === 0;

    const name = isMel
      ? `Mel ${isSilvestre ? "Silvestre" : "Orgânico"} Puro ${i}`
      : `Queijo Artesanal ${i}`;

    const shortDesc = isBoaEsperanca ? "Sítio Boa Esperança" : "Produto da Serra";
    const attrVal = isAmburana ? "Madeira Amburana" : "Padrão";

    products.push({
      id,
      name,
      slug: `produto-${i}`,
      shortDescription: shortDesc,
      fullDescription: `Descrição detalhada do produto ${i}`,
      type: "simple",
      isFeatured: i <= 10,
      status: "active",
      isPublished: true,
      storeId: isBoaEsperanca ? "store-boa-esperanca" : "store-padrao",
      categoryId: isMel ? "cat-mel" : "cat-queijos",
      brandId: "brand-1",
      store: {
        id: isBoaEsperanca ? "store-boa-esperanca" : "store-padrao",
        name: isBoaEsperanca ? "Engenho Boa Esperança" : "Loja Padrão",
        slug: isBoaEsperanca ? "boa-esperanca" : "loja-padrao",
        logoUrl: null,
      },
      category: {
        id: isMel ? "cat-mel" : "cat-queijos",
        name: isMel ? "Mel" : "Queijos",
        slug: isMel ? "mel" : "queijos",
      },
      brand: { id: "brand-1", name: "Serra Verde", slug: "serra-verde" },
      medias: [],
      variations: [
        {
          id: `var-${i}`,
          sku: `SKU-BENCH-${i}`,
          barcode: `7890000${i}`,
          price: "50.00",
          promotionalPrice: i % 3 === 0 ? "40.00" : null,
          isDefault: true,
          status: "active",
          deletedAt: null,
          values: [
            {
              optionValue: {
                value: attrVal,
                option: { name: "Sabor" },
              },
            },
          ],
        },
      ],
    });

    const searchText = normalizeSearchText(
      `${name} ${isMel ? "mel" : "queijo"} ${shortDesc} ${attrVal}`
    );

    searchDocs.push({
      productId: id,
      titleNormalized: normalizeSearchText(name),
      contextNormalized: normalizeSearchText(`Mel Queijos ${isBoaEsperanca ? "Boa Esperança" : ""}`),
      attributesNormalized: normalizeSearchText(attrVal),
      descriptionNormalized: normalizeSearchText(shortDesc),
      searchTextNormalized: searchText,
    });
  }

  return { products, searchDocs };
}

describe("Etapa 8 — Product Discovery Benchmark & Observabilidade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Benchmark de Volume (100 a 1.000 produtos)", () => {
    it("1. Mede busca simples ('mel') com 1.000 produtos", async () => {
      const { products, searchDocs } = generateMockProducts(1000);

      vi.mocked(prisma.category.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.store.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.brand.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.marketplaceSettings.findFirst).mockResolvedValue({ outOfStockBehavior: "show_badge" } as any);
      vi.mocked(prisma.productVariation.findMany).mockResolvedValue([]);

      // Mock candidate search matching 'mel' anchor token
      const melCandidates = searchDocs.filter((d) => d.searchTextNormalized.includes("mel"));
      vi.mocked(prisma.productSearchDocument.findMany).mockResolvedValue(melCandidates as any);

      // Mock base product findMany matching candidate IDs
      const melProducts = products.filter((p) => melCandidates.some((c) => c.productId === p.id));
      vi.mocked(prisma.product.findMany).mockResolvedValue(melProducts as any);
      vi.mocked(prisma.stockItem.findMany).mockResolvedValue([]);

      const startTime = performance.now();
      const result = await PublicDiscoveryService.discover({
        page: 1,
        perPage: 12,
        sort: "relevance",
        search: "mel",
      });
      const durationMs = performance.now() - startTime;

      expect(result.products.length).toBeLessThanOrEqual(12);
      expect(result.pagination.total).toBe(melProducts.length);
      expect(durationMs).toBeLessThan(100); // Benchmark criteria: < 100ms
    });

    it("2. Mede busca multi-termo ('mel silvestre') com 1.000 produtos", async () => {
      const { products, searchDocs } = generateMockProducts(1000);

      vi.mocked(prisma.category.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.store.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.brand.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.marketplaceSettings.findFirst).mockResolvedValue({ outOfStockBehavior: "show_badge" } as any);
      vi.mocked(prisma.productVariation.findMany).mockResolvedValue([]);

      const melCandidates = searchDocs.filter((d) => d.searchTextNormalized.includes("mel"));
      vi.mocked(prisma.productSearchDocument.findMany).mockResolvedValue(melCandidates as any);

      const matchingProds = products.filter((p) =>
        melCandidates.some(
          (c) => c.productId === p.id && c.searchTextNormalized.includes("silvestre")
        )
      );
      vi.mocked(prisma.product.findMany).mockResolvedValue(matchingProds as any);
      vi.mocked(prisma.stockItem.findMany).mockResolvedValue([]);

      const startTime = performance.now();
      const result = await PublicDiscoveryService.discover({
        page: 1,
        perPage: 12,
        sort: "relevance",
        search: "mel silvestre",
      });
      const durationMs = performance.now() - startTime;

      expect(result.products.length).toBeLessThanOrEqual(12);
      expect(durationMs).toBeLessThan(100);
    });

    it("3. Mede busca por contexto ('Boa Esperança') com 1.000 produtos", async () => {
      const { products, searchDocs } = generateMockProducts(1000);

      vi.mocked(prisma.category.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.store.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.brand.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.marketplaceSettings.findFirst).mockResolvedValue({ outOfStockBehavior: "show_badge" } as any);
      vi.mocked(prisma.productVariation.findMany).mockResolvedValue([]);

      const candidates = searchDocs.filter((d) => d.searchTextNormalized.includes("boa"));
      vi.mocked(prisma.productSearchDocument.findMany).mockResolvedValue(candidates as any);

      const matchingProds = products.filter((p) => candidates.some((c) => c.productId === p.id));
      vi.mocked(prisma.product.findMany).mockResolvedValue(matchingProds as any);
      vi.mocked(prisma.stockItem.findMany).mockResolvedValue([]);

      const startTime = performance.now();
      const result = await PublicDiscoveryService.discover({
        page: 1,
        perPage: 12,
        sort: "relevance",
        search: "Boa Esperança",
      });
      const durationMs = performance.now() - startTime;

      expect(durationMs).toBeLessThan(100);
      expect(result.context.type).toBe("search");
    });

    it("4. Mede busca por atributo ('amburana') com 1.000 produtos", async () => {
      const { products, searchDocs } = generateMockProducts(1000);

      vi.mocked(prisma.category.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.store.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.brand.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.marketplaceSettings.findFirst).mockResolvedValue({ outOfStockBehavior: "show_badge" } as any);
      vi.mocked(prisma.productVariation.findMany).mockResolvedValue([]);

      const candidates = searchDocs.filter((d) => d.searchTextNormalized.includes("amburana"));
      vi.mocked(prisma.productSearchDocument.findMany).mockResolvedValue(candidates as any);

      const matchingProds = products.filter((p) => candidates.some((c) => c.productId === p.id));
      vi.mocked(prisma.product.findMany).mockResolvedValue(matchingProds as any);
      vi.mocked(prisma.stockItem.findMany).mockResolvedValue([]);

      const startTime = performance.now();
      const result = await PublicDiscoveryService.discover({
        page: 1,
        perPage: 12,
        sort: "relevance",
        search: "amburana",
      });
      const durationMs = performance.now() - startTime;

      expect(durationMs).toBeLessThan(100);
      expect(result.products.length).toBeGreaterThan(0);
    });

    it("5. Mede termo inexistente ('xyz-inexistente')", async () => {
      vi.mocked(prisma.category.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.store.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.brand.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.marketplaceSettings.findFirst).mockResolvedValue({ outOfStockBehavior: "show_badge" } as any);
      vi.mocked(prisma.productVariation.findMany).mockResolvedValue([]);
      vi.mocked(prisma.productSearchDocument.findMany).mockResolvedValue([]);
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);
      vi.mocked(prisma.stockItem.findMany).mockResolvedValue([]);

      const startTime = performance.now();
      const result = await PublicDiscoveryService.discover({
        page: 1,
        perPage: 12,
        sort: "relevance",
        search: "xyz-inexistente",
      });
      const durationMs = performance.now() - startTime;

      expect(result.products).toHaveLength(0);
      expect(durationMs).toBeLessThan(50);
    });

    it("6. Mede paginação profunda (page=5)", async () => {
      const { products } = generateMockProducts(100);


      vi.mocked(prisma.category.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.store.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.brand.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.marketplaceSettings.findFirst).mockResolvedValue({ outOfStockBehavior: "show_badge" } as any);
      vi.mocked(prisma.productVariation.findMany).mockResolvedValue([]);
      vi.mocked(prisma.productSearchDocument.findMany).mockResolvedValue([]);
      vi.mocked(prisma.product.findMany).mockResolvedValue(products as any);
      vi.mocked(prisma.stockItem.findMany).mockResolvedValue([]);

      const startTime = performance.now();
      const result = await PublicDiscoveryService.discover({
        page: 5,
        perPage: 12,
        sort: "newest",
      });
      const durationMs = performance.now() - startTime;

      expect(result.pagination.page).toBe(5);
      expect(result.products.length).toBeLessThanOrEqual(12);
      expect(durationMs).toBeLessThan(50);
    });
  });

  describe("Diagnóstico de Discrepância (ProductSearchIndexService)", () => {
    it("7. getDiscrepancyReport identifica produtos sem documento e documentos órfãos", async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([
        { id: "prod-1" },
        { id: "prod-2" },
      ] as any);

      vi.mocked(prisma.productSearchDocument.findMany).mockResolvedValue([
        { productId: "prod-1" },
        { productId: "orphan-prod" },
      ] as any);

      const report = await ProductSearchIndexService.getDiscrepancyReport();

      expect(report.totalActiveProducts).toBe(2);
      expect(report.totalSearchDocuments).toBe(2);
      expect(report.missingDocumentProductIds).toEqual(["prod-2"]);
      expect(report.orphanDocumentProductIds).toEqual(["orphan-prod"]);
    });
  });
});
