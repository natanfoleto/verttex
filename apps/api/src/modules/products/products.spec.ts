import { randomUUID } from 'node:crypto'

import { afterEach, describe, expect, it } from 'vitest'

import { prisma } from '../../infrastructure/database/prisma'
import { ProductsService } from './products.service'

// Tracks IDs of products created during tests so they can be cleaned up after each test
const createdProductIds: string[] = []
const createdFileIds: string[] = []
const asAdmin = (id: string) => ({ id, role: 'admin' })

describe('Products & Catalog Service', () => {
  afterEach(async () => {
    // Hard-delete test products (and their variations/media) to prevent polluting production data
    if (createdProductIds.length > 0) {
      await prisma.product.deleteMany({
        where: { id: { in: createdProductIds } },
      })
      createdProductIds.length = 0
    }
    if (createdFileIds.length > 0) {
      await prisma.file.deleteMany({
        where: { id: { in: createdFileIds } },
      })
      createdFileIds.length = 0
    }
  })

  it('should create a simple product and auto-generate default variation with price', async () => {
    const store = await prisma.store.findFirst({ where: { deletedAt: null } })
    const category = await prisma.category.findFirst({
      where: { deletedAt: null },
    })
    const adminUser = await prisma.user.findFirst()

    if (!store || !category || !adminUser) return

    const randomSuffix = Math.random().toString(36).substring(2, 7)
    const product = await ProductsService.createProduct(
      {
        storeId: store.id,
        categoryId: category.id,
        name: `Queijo Minas Frescal ${randomSuffix}`,
        type: 'simple',
        price: 35.5,
        sku: `MINAS-FRESCAL-${randomSuffix.toUpperCase()}`,
        status: 'draft',
        isPublished: false,
        isFeatured: false,
        hasBatchControl: false,
        hasExpirationControl: false,
        isExpirationRequired: false,
        options: [],
        variations: [],
        mediaFileIds: [],
      },
      asAdmin(adminUser.id),
    )

    createdProductIds.push(product.id)

    expect(product).toBeDefined()
    expect(product.type).toBe('simple')
    expect(product.variations?.length).toBeGreaterThanOrEqual(1)
    expect(product.variations?.[0]?.sku).toBe(
      `MINAS-FRESCAL-${randomSuffix.toUpperCase()}`,
    )
    expect(Number(product.variations?.[0]?.price)).toBe(35.5)
  })

  it('should reject publication when the product has no approved main image', async () => {
    const store = await prisma.store.findFirst({
      where: { status: 'active', deletedAt: null },
    })
    const category = await prisma.category.findFirst({
      where: { status: 'active', isVisible: true, deletedAt: null },
    })
    const adminUser = await prisma.user.findFirst()

    if (!store || !category || !adminUser) return

    const randomSuffix = Math.random().toString(36).substring(2, 7)
    const product = await ProductsService.createProduct(
      {
        storeId: store.id,
        categoryId: category.id,
        name: `Queijo Tulha Maturado ${randomSuffix}`,
        type: 'simple',
        price: 89.9,
        status: 'active',
        isPublished: false,
        isFeatured: false,
        hasBatchControl: false,
        hasExpirationControl: false,
        isExpirationRequired: false,
        options: [],
        variations: [],
        mediaFileIds: [],
      },
      asAdmin(adminUser.id),
    )

    createdProductIds.push(product.id)

    await expect(
      ProductsService.publishProduct(product.id, asAdmin(adminUser.id)),
    ).rejects.toThrow('imagem principal aprovada')
  })

  it('should reject bypassing the canonical publication action on creation', async () => {
    await expect(
      ProductsService.createProduct(
        {
          storeId: 'store-id-not-used',
          categoryId: 'category-id-not-used',
          name: 'Produto publicado por atalho',
          type: 'simple',
          price: 10,
          status: 'active',
          isPublished: true,
          isFeatured: false,
          hasBatchControl: false,
          hasExpirationControl: false,
          isExpirationRequired: false,
          options: [],
          variations: [],
          mediaFileIds: [],
        },
        asAdmin('user-id-not-used'),
      ),
    ).rejects.toThrow('Use a ação de publicação')
  })

  it('should reject product media from an ineligible purpose', async () => {
    const store = await prisma.store.findFirst({ where: { deletedAt: null } })
    const category = await prisma.category.findFirst({
      where: { deletedAt: null },
    })
    const adminUser = await prisma.user.findFirst()

    if (!store || !category || !adminUser) return

    const file = await prisma.file.create({
      data: {
        provider: 'local',
        bucket: 'test',
        objectKey: `tests/products/${randomUUID()}.png`,
        originalName: 'banner.png',
        extension: 'png',
        mimeType: 'image/png',
        size: 68,
        checksum: 'b'.repeat(64),
        width: 1,
        height: 1,
        status: 'approved',
        purpose: 'marketplace_banner',
        userId: adminUser.id,
        storeId: store.id,
      },
    })
    createdFileIds.push(file.id)

    await expect(
      ProductsService.createProduct(
        {
          storeId: store.id,
          categoryId: category.id,
          name: `Produto com banner ${randomUUID()}`,
          type: 'simple',
          price: 10,
          status: 'draft',
          isPublished: false,
          isFeatured: false,
          hasBatchControl: false,
          hasExpirationControl: false,
          isExpirationRequired: false,
          options: [],
          variations: [],
          mediaFileIds: [file.id],
          mainMediaFileId: file.id,
        },
        asAdmin(adminUser.id),
      ),
    ).rejects.toThrow('imagem aprovada e vinculada à mesma loja')
  })

  it('should publish active product when all readiness conditions are met', async () => {
    const store = await prisma.store.findFirst({
      where: { status: 'active', deletedAt: null },
    })
    const category = await prisma.category.findFirst({
      where: { status: 'active', isVisible: true, deletedAt: null },
    })
    const adminUser = await prisma.user.findFirst()

    if (!store || !category || !adminUser) return

    const objectKey = `tests/products/${randomUUID()}.png`
    const file = await prisma.file.create({
      data: {
        provider: 'local',
        bucket: 'test',
        objectKey,
        originalName: 'produto.png',
        extension: 'png',
        mimeType: 'image/png',
        size: 68,
        checksum: 'a'.repeat(64),
        width: 1,
        height: 1,
        status: 'approved',
        purpose: 'product_image',
        userId: adminUser.id,
        storeId: store.id,
      },
    })
    createdFileIds.push(file.id)

    const randomSuffix = Math.random().toString(36).substring(2, 7)
    const product = await ProductsService.createProduct(
      {
        storeId: store.id,
        categoryId: category.id,
        name: `Queijo Publicável ${randomSuffix}`,
        type: 'simple',
        price: 89.9,
        status: 'active',
        isPublished: false,
        isFeatured: false,
        hasBatchControl: false,
        hasExpirationControl: false,
        isExpirationRequired: false,
        options: [],
        variations: [],
        mediaFileIds: [file.id],
        mainMediaFileId: file.id,
      },
      asAdmin(adminUser.id),
    )

    createdProductIds.push(product.id)

    const published = await ProductsService.publishProduct(
      product.id,
      asAdmin(adminUser.id),
    )
    expect(published.isPublished).toBe(true)
  })

  it('should archive product via soft-delete', async () => {
    const store = await prisma.store.findFirst({ where: { deletedAt: null } })
    const category = await prisma.category.findFirst({
      where: { deletedAt: null },
    })
    const adminUser = await prisma.user.findFirst()

    if (!store || !category || !adminUser) return

    const randomSuffix = Math.random().toString(36).substring(2, 7)
    const product = await ProductsService.createProduct(
      {
        storeId: store.id,
        categoryId: category.id,
        name: `Produto a ser Arquivado ${randomSuffix}`,
        type: 'simple',
        price: 19.9,
        status: 'draft',
        isPublished: false,
        isFeatured: false,
        hasBatchControl: false,
        hasExpirationControl: false,
        isExpirationRequired: false,
        options: [],
        variations: [],
        mediaFileIds: [],
      },
      asAdmin(adminUser.id),
    )

    createdProductIds.push(product.id)

    await ProductsService.archiveProduct(product.id, asAdmin(adminUser.id))

    const archivedInDb = await prisma.product.findUnique({
      where: { id: product.id },
    })
    expect(archivedInDb?.deletedAt).not.toBeNull()
    expect(archivedInDb?.status).toBe('archived')
    expect(archivedInDb?.isPublished).toBe(false)
  })
})
