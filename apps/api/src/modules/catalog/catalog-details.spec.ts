import { describe, expect, it, vi, beforeEach } from "vitest";
import { PublicCatalogService } from "./catalog.service";
import { prisma } from "../../infrastructure/database/prisma";

vi.mock("../../infrastructure/database/prisma", () => ({
  prisma: {
    product: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    category: {
      findMany: vi.fn(),
    },
    store: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    stockItem: {
      findMany: vi.fn(),
    },
  },
}));

describe("Public Catalog Details & Dynamic Integration Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should retrieve public product details by slug with store and R2 medias", async () => {
    vi.mocked(prisma.product.findFirst).mockResolvedValue({
      id: "prod-1",
      name: "Queijo Canastra",
      slug: "queijo-canastra",
      shortDescription: "Queijo artesanal de leite cru",
      fullDescription: "Curado na Serra da Canastra por 60 dias.",
      type: "simple",
      isFeatured: true,
      status: "active",
      isPublished: true,
      storeId: "store-1",
      store: {
        id: "store-1",
        name: "Queijaria Alvorada",
        slug: "queijaria-alvorada",
        description: "Tradição em queijos",
        logoUrl: null,
        coverUrl: null,
      },
      category: { id: "cat-1", name: "Queijos", slug: "queijos" },
      brand: null,
      medias: [
        {
          id: "m-1",
          isMain: true,
          altText: "Queijo Canastra",
          file: { objectKey: "queijo-canastra.jpg" },
        },
      ],
      options: [],
      variations: [
        {
          id: "var-1",
          sku: "QJ-01",
          price: 68.9,
          promotionalPrice: null,
          isDefault: true,
          values: [],
        },
      ],
    } as any);

    vi.mocked(prisma.stockItem.findMany).mockResolvedValue([
      { physicalQuantity: 10, reservedQuantity: 2, location: { status: "active" }, lot: null } as any,
    ]);

    const details = await PublicCatalogService.getPublicProductDetails("queijo-canastra");

    expect(details.name).toBe("Queijo Canastra");
    expect(details.store.name).toBe("Queijaria Alvorada");
    expect(details.variations[0]?.commercialStockAvailable).toBe(8);
    expect(details.images[0]?.url).toContain("queijo-canastra.jpg");
  });

  it("should throw error if product is unpublished or not found", async () => {
    vi.mocked(prisma.product.findFirst).mockResolvedValue(null);

    await expect(
      PublicCatalogService.getPublicProductDetails("inexistent-slug"),
    ).rejects.toThrow("Produto não encontrado ou indisponível no marketplace");
  });

  it("should list active categories with product counts", async () => {
    vi.mocked(prisma.category.findMany).mockResolvedValue([
      {
        id: "cat-1",
        name: "Queijos Artesanais",
        slug: "queijos-artesanais",
        description: "Queijos de leite cru",
        imageUrl: null,
        iconUrl: null,
        parentId: null,
        _count: { products: 14 },
      } as any,
    ]);

    const categories = await PublicCatalogService.listPublicCategories();

    expect(categories).toHaveLength(1);
    expect(categories[0]?.name).toBe("Queijos Artesanais");
    expect(categories[0]?.productsCount).toBe(14);
  });
});
