import { describe, expect, it } from "vitest";
import { prisma } from "../../infrastructure/database/prisma";
import { ProductsService } from "./products.service";

describe("Products & Catalog Service", () => {
  it("should create a simple product and auto-generate default variation with price", async () => {
    const store = await prisma.store.findFirst({ where: { deletedAt: null } });
    const category = await prisma.category.findFirst({
      where: { deletedAt: null },
    });
    const adminUser = await prisma.user.findFirst();

    if (!store || !category || !adminUser) return;

    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const product = await ProductsService.createProduct(
      {
        storeId: store.id,
        categoryId: category.id,
        name: `Queijo Minas Frescal ${randomSuffix}`,
        type: "simple",
        price: 35.5,
        sku: `MINAS-FRESCAL-${randomSuffix.toUpperCase()}`,
        status: "draft",
        isPublished: false,
        isFeatured: false,
        options: [],
        variations: [],
        mediaFileIds: [],
      },
      adminUser.id,
    );

    expect(product).toBeDefined();
    expect(product.type).toBe("simple");
    expect(product.variations?.length).toBeGreaterThanOrEqual(1);
    expect(product.variations?.[0]?.sku).toBe(
      `MINAS-FRESCAL-${randomSuffix.toUpperCase()}`,
    );
    expect(Number(product.variations?.[0]?.price)).toBe(35.5);
  });

  it("should publish active product when all readiness conditions are met", async () => {
    const store = await prisma.store.findFirst({
      where: { status: "active", deletedAt: null },
    });
    const category = await prisma.category.findFirst({
      where: { deletedAt: null },
    });
    const adminUser = await prisma.user.findFirst();

    if (!store || !category || !adminUser) return;

    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const product = await ProductsService.createProduct(
      {
        storeId: store.id,
        categoryId: category.id,
        name: `Queijo Tulha Maturado ${randomSuffix}`,
        type: "simple",
        price: 89.9,
        status: "active",
        isPublished: false,
        isFeatured: false,
        options: [],
        variations: [],
        mediaFileIds: [],
      },
      adminUser.id,
    );

    const published = await ProductsService.publishProduct(
      product.id,
      adminUser.id,
    );
    expect(published.isPublished).toBe(true);
  });

  it("should archive product via soft-delete", async () => {
    const store = await prisma.store.findFirst({ where: { deletedAt: null } });
    const category = await prisma.category.findFirst({
      where: { deletedAt: null },
    });
    const adminUser = await prisma.user.findFirst();

    if (!store || !category || !adminUser) return;

    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const product = await ProductsService.createProduct(
      {
        storeId: store.id,
        categoryId: category.id,
        name: `Produto a ser Arquivado ${randomSuffix}`,
        type: "simple",
        price: 19.9,
        status: "draft",
        isPublished: false,
        isFeatured: false,
        options: [],
        variations: [],
        mediaFileIds: [],
      },
      adminUser.id,
    );

    await ProductsService.archiveProduct(product.id, adminUser.id);

    const archivedInDb = await prisma.product.findUnique({
      where: { id: product.id },
    });
    expect(archivedInDb?.deletedAt).not.toBeNull();
    expect(archivedInDb?.status).toBe("archived");
    expect(archivedInDb?.isPublished).toBe(false);
  });
});
