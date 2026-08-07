import { beforeEach, describe, expect, it, vi } from 'vitest'

import { prisma } from './infrastructure/database/prisma'
import { FilesService } from './modules/files/files.service'
import { listLotsQuerySchema } from './modules/lots/lots.schemas'
import { LotsService } from './modules/lots/lots.service'
import { NotificationsService } from './modules/notifications/notifications.service'
import { OrdersService } from './modules/orders/orders.service'
import { productListQuerySchema } from './modules/products/products.schemas'
import { ProductsService } from './modules/products/products.service'
import { ReportsService } from './modules/reports/reports.service'
import {
  clearReturnsStore,
  ReturnsService,
} from './modules/returns/returns.service'
import { ReviewsService } from './modules/reviews/reviews.service'
import { ShippingService } from './modules/shipping/shipping.service'
import { listStockMovementsQuerySchema } from './modules/stock/stock.schemas'
import { StockService } from './modules/stock/stock.service'
import { StoreAccessPolicy } from './shared/policies/store-access.policy'

vi.mock('./infrastructure/database/prisma', () => ({
  prisma: {
    storeUser: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    product: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    productLot: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    stockMovement: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    file: {
      findFirst: vi.fn(),
    },
    order: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    orderItem: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('./shared/utils/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}))

const actor = { id: 'user-store-a', role: 'supplier' }
const storeA = 'store-a'
const storeB = 'store-b'

describe('DEBT-003: tenant isolation across two stores', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearReturnsStore()

    vi.mocked(prisma.storeUser.findMany).mockResolvedValue([
      { storeId: storeA },
    ] as Awaited<ReturnType<typeof prisma.storeUser.findMany>>)
    vi.mocked(prisma.storeUser.findFirst).mockResolvedValue(null)

    vi.mocked(prisma.product.findMany).mockResolvedValue([])
    vi.mocked(prisma.product.count).mockResolvedValue(0)
    vi.mocked(prisma.productLot.findMany).mockResolvedValue([])
    vi.mocked(prisma.productLot.count).mockResolvedValue(0)
    vi.mocked(prisma.stockMovement.findMany).mockResolvedValue([])
    vi.mocked(prisma.stockMovement.count).mockResolvedValue(0)
    vi.mocked(prisma.order.findMany).mockResolvedValue([])
    vi.mocked(prisma.order.count).mockResolvedValue(0)
  })

  it('central policy grants only active linked stores and rejects store B', async () => {
    const filter = await StoreAccessPolicy.resolveStoreFilter(actor)
    expect(filter).toEqual({ in: [storeA] })
    expect(prisma.storeUser.findMany).toHaveBeenCalledWith({
      where: {
        userId: actor.id,
        isActive: true,
        store: { deletedAt: null },
      },
      select: { storeId: true },
    })

    vi.mocked(prisma.storeUser.findFirst).mockResolvedValueOnce({
      id: 'link-store-a',
    } as Awaited<ReturnType<typeof prisma.storeUser.findFirst>>)
    await expect(
      StoreAccessPolicy.assertStoreAccess(actor, storeA),
    ).resolves.toBeUndefined()

    await expect(
      StoreAccessPolicy.assertStoreAccess(actor, storeB),
    ).rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 })
  })

  it('automatically scopes product, lot, stock, order and report listings to store A', async () => {
    await ProductsService.listProducts(productListQuerySchema.parse({}), actor)
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ storeId: { in: [storeA] } }),
      }),
    )

    await LotsService.listLots(listLotsQuerySchema.parse({}), actor)
    expect(prisma.productLot.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ storeId: { in: [storeA] } }),
      }),
    )

    await StockService.listStockMovements(
      listStockMovementsQuerySchema.parse({}),
      actor,
    )
    expect(prisma.stockMovement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ storeId: { in: [storeA] } }),
      }),
    )

    await OrdersService.listManagerOrders({}, actor)
    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ storeId: { in: [storeA] } }),
      }),
    )

    await ReportsService.getSalesSummary({}, actor)
    expect(prisma.order.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ storeId: { in: [storeA] } }),
      }),
    )
  })

  it('rejects explicit store B mutations before touching product, lot, stock, file or notification data', async () => {
    await expect(
      ProductsService.createProduct(
        {
          storeId: storeB,
          categoryId: 'category-1',
          name: 'Produto da loja B',
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
          mediaFileIds: [],
        },
        actor,
      ),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })

    await expect(
      LotsService.createLot(
        {
          storeId: storeB,
          productId: 'product-b',
          lotNumber: 'LOT-B',
        },
        actor,
      ),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })

    await expect(
      StockService.adjustStock(
        {
          storeId: storeB,
          variationId: 'variation-b',
          locationId: 'location-b',
          newPhysicalQuantity: 10,
          reason: 'Tentativa entre lojas',
        },
        actor,
      ),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })

    await expect(
      FilesService.requestUpload(
        {
          fileName: 'produto.png',
          mimeType: 'image/png',
          size: 1024,
          purpose: 'product_image',
          storeId: storeB,
        },
        actor,
      ),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })

    await expect(
      NotificationsService.checkLotExpirations({ storeId: storeB }, actor),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('rejects tenant resources resolved indirectly from IDs in store B', async () => {
    vi.mocked(prisma.productLot.findUnique).mockResolvedValue({
      id: 'lot-b',
      storeId: storeB,
      expirationDate: null,
      product: {
        minDeliveryShelfLifeDays: 15,
        warningShelfLifeDays: 30,
      },
    } as unknown as Awaited<ReturnType<typeof prisma.productLot.findUnique>>)

    await expect(
      LotsService.getLotDetails('lot-b', actor),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })

    vi.mocked(prisma.file.findFirst).mockResolvedValue({
      id: 'file-b',
      publicId: 'public-file-b',
      storeId: storeB,
      userId: 'user-store-b',
      objectKey: 'stores/b/file.png',
    } as unknown as Awaited<ReturnType<typeof prisma.file.findFirst>>)

    await expect(FilesService.getFile('file-b', actor)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })

    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: 'order-b',
      storeId: storeB,
      status: 'PAID',
      stockReservations: [],
      items: [],
    } as unknown as Awaited<ReturnType<typeof prisma.order.findUnique>>)

    await expect(
      ShippingService.dispatchOrder(actor, 'order-b', {
        trackingCode: 'TRACK-B',
        carrierName: 'Carrier B',
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('rejects store B returns and product moderation resolved from in-memory records', async () => {
    vi.mocked(prisma.order.findFirst).mockResolvedValue({
      id: 'order-b',
      code: 'VTX-B',
      customerId: 'customer-b',
      storeId: storeB,
      status: 'DELIVERED',
    } as unknown as Awaited<ReturnType<typeof prisma.order.findFirst>>)

    const returnRecord = await ReturnsService.requestReturn('customer-b', {
      orderId: 'order-b',
      reason: 'Teste de isolamento',
      items: [{ orderItemId: 'item-b', quantity: 1 }],
    })

    await expect(
      ReturnsService.receiveReturnInQuarantine(actor, returnRecord.id, {}),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })

    const question = await ReviewsService.createQuestion('customer-b', {
      productId: 'product-b',
      question: 'Pergunta da loja B?',
    })
    vi.mocked(prisma.product.findFirst).mockResolvedValue({
      storeId: storeB,
    } as Awaited<ReturnType<typeof prisma.product.findFirst>>)

    await expect(
      ReviewsService.answerQuestion(actor, question.id, {
        answer: 'Resposta indevida da loja A',
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })
})
