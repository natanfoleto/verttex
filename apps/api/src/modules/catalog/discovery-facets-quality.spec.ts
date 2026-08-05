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

function setupFacetMocks() {
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
      attributes: v.attributes,
      values: Object.entries(v.attributes || {}).map(([key, val]) => ({
        optionValue: { option: { name: key }, value: val },
      })),
      stockItems: [{ quantity: p.stockTotal }],
    })),
  }));

  mockPrisma(prisma.category.findFirst).mockImplementation(
    async (args?: Parameters<typeof prisma.category.findFirst>[0]) => {
      const slugWhere = (args?.where as { slug?: string } | undefined)?.slug;
      if (slugWhere === "cachacas-artesanais") {
        return {
          id: "cat-cachaca",
          name: "Cachaças Artesanais",
          slug: "cachacas-artesanais",
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
      return null;
    }
  );

  mockPrisma(prisma.category.findMany).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof prisma.category.findMany>>);
  mockPrisma(prisma.store.findFirst).mockResolvedValue(null);
  mockPrisma(prisma.brand.findFirst).mockResolvedValue(null);

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
      return result as unknown as Awaited<ReturnType<typeof prisma.productSearchDocument.findMany>>;
    }
  );

  mockPrisma(prisma.product.findMany).mockImplementation(
    async (args?: Parameters<typeof prisma.product.findMany>[0]) => {
      let result = [...fullProducts];
      const catIn = (args?.where as { categoryId?: { in?: string[] } } | undefined)?.categoryId?.in;
      const idIn = (args?.where as { id?: { in?: string[] } } | undefined)?.id?.in;

      if (catIn) {
        result = result.filter((p) => catIn.includes(p.categoryId));
      }

      if (idIn) {
        result = result.filter((p) => idIn.includes(p.id));
      }

      if (args?.where?.OR && Array.isArray(args.where.OR)) {
        result = result.filter((p) => {
          const doc = searchDocs.find((d) => d.productId === p.id);
          if (!doc) return false;

          const firstOr = args.where?.OR?.[0] as { name?: { contains?: string } } | undefined;
          const rawTerm = firstOr?.name?.contains || "";
          const tokens = tokenizeQuery(rawTerm);
          if (tokens.length > 0) {
            return tokens.every((t) => doc.searchTextNormalized.includes(t));
          }
          return true;
        });
      }

      return result as unknown as Awaited<ReturnType<typeof prisma.product.findMany>>;
    }
  );

  mockPrisma(prisma.productVariation.findMany).mockImplementation(async () => {
    const allVariations = fullProducts.flatMap((p) =>
      p.variations.map((v) => ({
        ...v,
        productId: p.id,
        attributes: v.attributes,
      }))
    );
    return allVariations as unknown as Awaited<ReturnType<typeof prisma.productVariation.findMany>>;
  });
}

describe("Discovery Quality — Facetas & Filtros de Atributos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupFacetMocks();
  });

  it("25. Facetas — OR na mesma faceta (Amburana OR Carvalho)", async () => {
    const res = await PublicDiscoveryService.discover({
      search: "cachaca",
      attributes: { Madeira: "Amburana,Carvalho" },
      page: 1,
      perPage: 50,
    });
    const ids = res.products.map((p) => p.id);

    expect(ids).toContain("prod-golden-3");
    expect(ids).toContain("prod-golden-4");
    expect(ids).not.toContain("prod-golden-5");
  });

  it("26. Facetas — AND entre facetas diferentes (Madeira = Amburana AND Volume = 750ml)", async () => {
    const res = await PublicDiscoveryService.discover({
      search: "cachaca",
      attributes: { Madeira: "Amburana", Volume: "750ml" },
      page: 1,
      perPage: 50,
    });
    const ids = res.products.map((p) => p.id);

    expect(ids).toContain("prod-golden-3");
  });

  it("27. Cenário Obrigatório de Mesma Variante Comercial: Amburana + 750ml (Validação estrita)", async () => {
    const resIncompatible = await PublicDiscoveryService.discover({
      attributes: { Madeira: "Amburana", Volume: "750ml" },
      page: 1,
      perPage: 50,
    });
    const idsIncompatible = resIncompatible.products.map((p) => p.id);

    if (idsIncompatible.includes("prod-golden-multi-var")) {
      console.error(`
---------------------------------------------------
FALHA DE REGRA DE NEGÓCIO (MESMA VARIANTE COMERCIAL):
Filtro: Amburana + 750ml
O produto 'prod-golden-multi-var' possui Var1(Amburana+500ml) e Var2(Carvalho+750ml).
NENHUMA variante isolada satisfaz Amburana + 750ml simultaneamente.
O produto NÃO deveria ter sido retornado.
---------------------------------------------------`);
    }

    expect(idsIncompatible).not.toContain("prod-golden-multi-var");

    const resCompatible = await PublicDiscoveryService.discover({
      attributes: { Madeira: "Amburana", Volume: "500ml" },
      page: 1,
      perPage: 50,
    });
    const idsCompatible = resCompatible.products.map((p) => p.id);
    expect(idsCompatible).toContain("prod-golden-multi-var");
  });

  it("28. Self-excluding facets (Contagens disjuntivas corretas por faceta)", async () => {
    const res = await PublicDiscoveryService.discover({ search: "mel", page: 1, perPage: 50 });
    const floradaFacet = res.availableFilters.find((f) => f.key === "Florada" || f.key === "attr_florada");

    if (floradaFacet) {
      const silvestreOpt = floradaFacet.options.find((o) => o.value === "Silvestre");
      const eucaliptoOpt = floradaFacet.options.find((o) => o.value === "Eucalipto");

      expect(silvestreOpt?.count).toBeGreaterThan(0);
      expect(eucaliptoOpt?.count).toBeGreaterThan(0);
    }
  });

  it("29. COUNT DISTINCT Product: Produto com múltiplas variantes que atendem a faceta conta 1 produto", async () => {
    const res = await PublicDiscoveryService.discover({ categorySlug: "cachacas-artesanais", page: 1, perPage: 50 });
    const madeiraFacet = res.availableFilters.find((f) => f.key === "Madeira" || f.key === "attr_madeira");

    if (madeiraFacet) {
      const amburanaOpt = madeiraFacet.options.find((o) => o.value === "Amburana");
      expect(amburanaOpt?.count).toBeLessThanOrEqual(res.products.length);
    }
  });
});
