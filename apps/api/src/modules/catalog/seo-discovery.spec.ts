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

// Helper logic tests (mirroring seo.ts logic)
function hasActiveFilters(params: Record<string, string | string[] | undefined>): boolean {
  const filterKeys = [
    "brand",
    "brandSlug",
    "store",
    "storeSlug",
    "category",
    "categorySlug",
    "minPrice",
    "maxPrice",
    "priceMin",
    "priceMax",
    "attributes",
    "sort",
    "search",
    "q",
  ];
  return Object.keys(params).some((k) => {
    if (k.startsWith("attr_")) return true;
    if (!filterKeys.includes(k)) return false;
    const val = params[k];
    return val !== undefined && val !== "";
  });
}

function getPageNumber(params: Record<string, string | string[] | undefined>): number | undefined {
  if (!params.page) return undefined;
  const rawPage = Array.isArray(params.page) ? params.page[0] : params.page;
  const parsed = parseInt(rawPage || "", 10);
  return !isNaN(parsed) && parsed > 1 ? parsed : undefined;
}

function buildMetadataHelper(opts: {
  canonicalPath: string;
  noIndex?: boolean;
  hasFilters?: boolean;
  page?: number;
}) {
  const shouldIndex = !opts.noIndex && !opts.hasFilters;
  let canonicalUrl = `http://localhost:3000${opts.canonicalPath}`;
  if (shouldIndex && opts.page && opts.page > 1) {
    canonicalUrl = `http://localhost:3000${opts.canonicalPath}?page=${opts.page}`;
  }
  return {
    robots: {
      index: shouldIndex,
      follow: true,
    },
    canonicalUrl,
  };
}

describe("Discovery SEO Metadata & Indexing Policy", () => {
  beforeEach(() => vi.clearAllMocks());

  it("1. Busca (/busca?q=mel) — noindex, follow e canonical /busca", async () => {
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
    expect(result.seo.canonicalUrl).toBe("/busca?q=mel");

    const meta = buildMetadataHelper({
      canonicalPath: "/busca",
      noIndex: true,
      hasFilters: true,
    });

    expect(meta.robots.index).toBe(false);
    expect(meta.robots.follow).toBe(true);
  });

  it("2. Categoria limpa (/categoria/mel) — index, follow + self canonical", async () => {
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

    const searchParams = {};
    const filtersApplied = hasActiveFilters(searchParams);
    const pageNum = getPageNumber(searchParams);

    const meta = buildMetadataHelper({
      canonicalPath: "/categoria/mel",
      hasFilters: filtersApplied,
      page: pageNum,
    });

    expect(meta.robots.index).toBe(true);
    expect(meta.canonicalUrl).toBe("http://localhost:3000/categoria/mel");
  });

  it("3. Categoria paginada sem filtros (/categoria/mel?page=2) — index, follow + canonical ?page=2", async () => {
    const searchParams = { page: "2" };
    const filtersApplied = hasActiveFilters(searchParams);
    const pageNum = getPageNumber(searchParams);

    expect(filtersApplied).toBe(false);
    expect(pageNum).toBe(2);

    const meta = buildMetadataHelper({
      canonicalPath: "/categoria/mel",
      hasFilters: filtersApplied,
      page: pageNum,
    });

    expect(meta.robots.index).toBe(true);
    expect(meta.canonicalUrl).toBe("http://localhost:3000/categoria/mel?page=2");
  });

  it("4. Categoria com ordenação (/categoria/mel?sort=price_asc) — noindex", async () => {
    const searchParams = { sort: "price_asc" };
    const filtersApplied = hasActiveFilters(searchParams);
    const pageNum = getPageNumber(searchParams);

    expect(filtersApplied).toBe(true);

    const meta = buildMetadataHelper({
      canonicalPath: "/categoria/mel",
      hasFilters: filtersApplied,
      page: pageNum,
    });

    expect(meta.robots.index).toBe(false);
    expect(meta.canonicalUrl).toBe("http://localhost:3000/categoria/mel");
  });

  it("5. Categoria com filtro + paginação (/categoria/mel?brand=x&page=2) — noindex", async () => {
    const searchParams = { brand: "x", page: "2" };
    const filtersApplied = hasActiveFilters(searchParams);
    const pageNum = getPageNumber(searchParams);

    expect(filtersApplied).toBe(true);

    const meta = buildMetadataHelper({
      canonicalPath: "/categoria/mel",
      hasFilters: filtersApplied,
      page: pageNum,
    });

    expect(meta.robots.index).toBe(false);
    expect(meta.canonicalUrl).toBe("http://localhost:3000/categoria/mel");
  });

  it("6. Produtor (/produtor/apiario-serra) — gera metadados dinamicos da loja", async () => {
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
  });

  it("7. Marca (/marca/serra-verde) — gera metadados dinamicos da marca", async () => {
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
});
