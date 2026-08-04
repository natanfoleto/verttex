import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../infrastructure/database/prisma";
import { PublicDiscoveryService } from "./discovery.service";

vi.mock("../../infrastructure/database/prisma", () => ({
  prisma: {
    product: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
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
    },
  },
}));

describe("Discovery SEO Metadata & Indexing Policy", () => {
  beforeEach(() => vi.clearAllMocks());

  it("1. Busca (/busca?q=mel) — gera canonical de busca e titulo contextual", async () => {
    vi.mocked(prisma.category.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.store.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.brand.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.marketplaceSettings.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.productVariation.findMany).mockResolvedValue([]);
    vi.mocked(prisma.productSearchDocument.findMany).mockResolvedValue([]);
    vi.mocked(prisma.product.findMany).mockResolvedValue([]);

    const result = await PublicDiscoveryService.discover({
      page: 1,
      perPage: 12,
      sort: "relevance",
      search: "mel",
    });

    expect(result.context.type).toBe("search");
    expect(result.context.title).toContain("mel");
    expect(result.seo.canonicalUrl).toBe("/busca?q=mel");
    expect(result.seo.title).toContain("mel");
  });

  it("2. Categoria limpa (/categoria/alimentos/mel) — gera canonical estrutural", async () => {
    vi.mocked(prisma.category.findFirst).mockResolvedValue({
      id: "cat-mel",
      name: "Mel",
      slug: "mel",
      description: "Mel artesanal puro de produtores locais",
      parentId: null,
      parent: null,
    } as any);
    vi.mocked(prisma.category.findMany).mockResolvedValue([]);
    vi.mocked(prisma.store.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.brand.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.marketplaceSettings.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.productVariation.findMany).mockResolvedValue([]);
    vi.mocked(prisma.productSearchDocument.findMany).mockResolvedValue([]);
    vi.mocked(prisma.product.findMany).mockResolvedValue([]);

    const result = await PublicDiscoveryService.discover({
      page: 1,
      perPage: 12,
      sort: "relevance",
      categorySlug: "mel",
    });

    expect(result.context.type).toBe("category");
    expect(result.context.category?.name).toBe("Mel");
    expect(result.seo.canonicalUrl).toBe("/categoria/mel");
    expect(result.seo.title).toContain("Mel");
    expect(result.seo.description).toContain("Mel artesanal");
  });

  it("3. Produtor (/produtor/apiario-serra) — gera metadados dinamicos da loja", async () => {
    vi.mocked(prisma.category.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.store.findFirst).mockResolvedValue({
      id: "store-apiario",
      name: "Apiário Serra",
      slug: "apiario-serra",
      description: "Produção familiar sustentável de mel",
      logoUrl: "https://r2.com/logo.jpg",
    } as any);
    vi.mocked(prisma.brand.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.marketplaceSettings.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.productVariation.findMany).mockResolvedValue([]);
    vi.mocked(prisma.productSearchDocument.findMany).mockResolvedValue([]);
    vi.mocked(prisma.product.findMany).mockResolvedValue([]);

    const result = await PublicDiscoveryService.discover({
      page: 1,
      perPage: 12,
      sort: "relevance",
      storeSlug: "apiario-serra",
    });

    expect(result.context.type).toBe("store");
    expect(result.context.store?.name).toBe("Apiário Serra");
    expect(result.seo.canonicalUrl).toBe("/produtor/apiario-serra");
    expect(result.seo.title).toContain("Apiário Serra");
  });

  it("4. Marca (/marca/serra-verde) — gera metadados dinamicos da marca", async () => {
    vi.mocked(prisma.category.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.store.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.brand.findFirst).mockResolvedValue({
      id: "brand-1",
      name: "Serra Verde",
      slug: "serra-verde",
      description: "Produtos artesanais da serra",
    } as any);
    vi.mocked(prisma.marketplaceSettings.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.productVariation.findMany).mockResolvedValue([]);
    vi.mocked(prisma.productSearchDocument.findMany).mockResolvedValue([]);
    vi.mocked(prisma.product.findMany).mockResolvedValue([]);

    const result = await PublicDiscoveryService.discover({
      page: 1,
      perPage: 12,
      sort: "relevance",
      brandSlug: "serra-verde",
    });

    expect(result.context.type).toBe("brand");
    expect(result.context.brand?.name).toBe("Serra Verde");
    expect(result.seo.canonicalUrl).toBe("/marca/serra-verde");
  });

  it("5. Ofertas (/ofertas) — gera canonical de ofertas", async () => {
    vi.mocked(prisma.category.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.store.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.brand.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.marketplaceSettings.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.productVariation.findMany).mockResolvedValue([]);
    vi.mocked(prisma.productSearchDocument.findMany).mockResolvedValue([]);
    vi.mocked(prisma.product.findMany).mockResolvedValue([]);

    const result = await PublicDiscoveryService.discover({
      page: 1,
      perPage: 12,
      sort: "relevance",
      isOffer: true,
    });

    expect(result.seo.canonicalUrl).toBe("/ofertas");
  });
});
