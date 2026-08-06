import { beforeEach, describe, expect, it, vi } from 'vitest'

import { prisma } from '../../infrastructure/database/prisma'
import { ProductsService } from '../products/products.service'
import { StockService } from '../stock/stock.service'
import { OrdersService } from './orders.service'

vi.mock('../../infrastructure/database/prisma', () => ({
  prisma: {
    cart: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    customerAddress: {
      findFirst: vi.fn(),
    },
    stockItem: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    order: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    orderItem: {
      create: vi.fn(),
    },
    orderItemLot: {
      create: vi.fn(),
    },
    stockReservation: {
      create: vi.fn(),
      update: vi.fn(),
    },
    stockMovement: {
      create: vi.fn(),
    },
    cartItem: {
      deleteMany: vi.fn(),
    },
    productVariation: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(prisma)),
  },
}))

vi.mock('../stock/stock.service', () => ({
  StockService: {
    queryCommercialAvailability: vi.fn(),
    resolveStockMode: vi.fn(),
  },
}))

vi.mock('../products/products.service', () => ({
  ProductsService: {
    resolveEffectiveFiscalData: vi.fn(),
  },
}))

vi.mock('../../shared/utils/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}))

describe('OrdersService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkout', () => {
    it('should successfully execute checkout with atomic FEFO lot allocation and snapshot creation', async () => {
      // Mock cart data
      const mockCart = {
        id: 'cart-123',
        customerId: 'cust-1',
        items: [
          {
            id: 'cart-item-1',
            cartId: 'cart-123',
            variationId: 'var-1',
            storeId: 'store-1',
            quantity: 2,
            variation: {
              id: 'var-1',
              storeId: 'store-1',
              sku: 'QUEIJO-CURADO-500G',
              price: 45.0,
              promotionalPrice: 40.0,
              costPrice: 20.0,
              stockMode: 'BATCH_WITH_EXPIRATION',
              product: {
                id: 'prod-1',
                name: 'Queijo Canastra',
                medias: [{ url: 'http://image.url/cheese.jpg', isMain: true }],
              },
              values: [
                {
                  optionValue: {
                    value: 'Curado',
                    option: { name: 'Maturação' },
                  },
                },
              ],
              medias: [],
            },
          },
        ],
      }

      vi.mocked(prisma.cart.findFirst).mockResolvedValue(
        mockCart as unknown as Awaited<
          ReturnType<typeof prisma.cart.findFirst>
        >,
      )

      // Mock address
      vi.mocked(prisma.customerAddress.findFirst).mockResolvedValue({
        id: 'addr-1',
        customerId: 'cust-1',
      } as unknown as Awaited<
        ReturnType<typeof prisma.customerAddress.findFirst>
      >)

      // Mock StockService.resolveStockMode
      vi.mocked(StockService.resolveStockMode).mockReturnValue(
        'BATCH_WITH_EXPIRATION',
      )

      // Mock FEFO stock availability
      vi.mocked(StockService.queryCommercialAvailability).mockResolvedValue({
        storeId: 'store-1',
        variationId: 'var-1',
        productName: 'Queijo Canastra',
        sku: 'QUEIJO-CURADO-500G',
        totalCommercialAvailable: 10,
        isFulfillable: true,
        requestedQuantity: 2,
        allocatedQuantity: 2,
        fefoAllocations: [
          {
            stockItemId: 'stock-1',
            location: { id: 'loc-1' },
            lotId: 'lot-fefo-1',
            lotNumber: 'LOT-2026-A',
            expirationDate: new Date('2026-12-31'),
            availableQuantity: 5,
            allocatedQuantity: 2,
          },
        ],
      } as unknown as Awaited<
        ReturnType<typeof StockService.queryCommercialAvailability>
      >)

      // Mock fiscal inheritance
      vi.mocked(ProductsService.resolveEffectiveFiscalData).mockResolvedValue({
        ncm: '0406.90.10',
        cest: '17.087.00',
        fiscalOrigin: 0,
        commercialUnit: 'KG',
        taxableUnit: 'KG',
      })

      // Mock Order creation
      vi.mocked(prisma.order.create).mockResolvedValue({
        id: 'order-100',
        code: 'VTX-20260728-1001',
        totalAmount: 80.0,
        storeId: 'store-1',
      } as unknown as Awaited<ReturnType<typeof prisma.order.create>>)

      vi.mocked(prisma.orderItem.create).mockResolvedValue({
        id: 'order-item-1',
      } as unknown as Awaited<ReturnType<typeof prisma.orderItem.create>>)

      vi.mocked(prisma.stockReservation.create).mockResolvedValue({
        id: 'res-1',
      } as unknown as Awaited<
        ReturnType<typeof prisma.stockReservation.create>
      >)

      vi.mocked(prisma.stockItem.findFirst).mockResolvedValue({
        id: 'stock-item-1',
        reservedQuantity: 0,
      } as unknown as Awaited<ReturnType<typeof prisma.stockItem.findFirst>>)

      const result = await OrdersService.checkout('cust-1', {
        customerAddressId: 'addr-1',
        paymentMethod: 'pix',
      })

      expect(result.id).toBe('order-100')
      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customerId: 'cust-1',
            customerAddressId: 'addr-1',
            subtotal: 80.0,
            totalAmount: 80.0,
            paymentMethod: 'pix',
          }),
        }),
      )

      // Verify snapshot item creation
      expect(prisma.orderItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            productName: 'Queijo Canastra',
            variationName: 'Maturação: Curado',
            sku: 'QUEIJO-CURADO-500G',
            price: 40.0,
            ncm: '0406.90.10',
            quantity: 2,
          }),
        }),
      )

      // Verify stock reservation movement
      expect(prisma.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'RESERVATION',
            quantity: 2,
          }),
        }),
      )

      // Verify cart emptied
      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cartId: 'cart-123' },
      })
    })

    it('should throw validation error when cart is empty', async () => {
      vi.mocked(prisma.cart.findFirst).mockResolvedValue(null)

      await expect(
        OrdersService.checkout('cust-1', {
          customerAddressId: 'addr-1',
          paymentMethod: 'pix',
        }),
      ).rejects.toThrow('Seu carrinho está vazio')
    })

    it('should throw error when stock is insufficient', async () => {
      const mockStoreId = 'store-1'
      const mockVariationId = 'var-1'
      const mockCustomerId = 'cust-1'
      const mockAddressId = 'addr-1'

      const mockCart = {
        id: 'cart-123',
        customerId: mockCustomerId,
        items: [
          {
            id: 'cart-item-1',
            cartId: 'cart-123',
            variationId: mockVariationId,
            storeId: mockStoreId,
            quantity: 20,
            variation: {
              id: mockVariationId,
              stockMode: 'SIMPLE',
              product: { name: 'Queijo Canastra', medias: [] },
              values: [],
              medias: [],
            },
          },
        ],
      }

      vi.mocked(prisma.cart.findFirst).mockResolvedValue(
        mockCart as unknown as Awaited<
          ReturnType<typeof prisma.cart.findFirst>
        >,
      )
      vi.mocked(prisma.customerAddress.findFirst).mockResolvedValue({
        id: mockAddressId,
        customerId: mockCustomerId,
      } as unknown as Awaited<
        ReturnType<typeof prisma.customerAddress.findFirst>
      >)

      vi.mocked(prisma.stockItem.findMany).mockResolvedValue([
        {
          id: 'stock-item-1',
          storeId: mockStoreId,
          variationId: mockVariationId,
          physicalQuantity: 10,
          reservedQuantity: 0,
          createdAt: new Date(),
          location: { id: 'loc-1', name: 'Geral', code: 'GERAL' },
          lot: null,
        },
      ] as unknown as Awaited<ReturnType<typeof prisma.stockItem.findMany>>)

      vi.mocked(StockService.queryCommercialAvailability).mockResolvedValue({
        totalCommercialAvailable: 2,
        isFulfillable: false,
        fefoAllocations: [],
      } as unknown as Awaited<
        ReturnType<typeof StockService.queryCommercialAvailability>
      >)

      await expect(
        OrdersService.checkout(mockCustomerId, {
          customerAddressId: mockAddressId,
          paymentMethod: 'pix',
        }),
      ).rejects.toThrow('Estoque insuficiente')
    })
  })

  describe('cancelOrder', () => {
    it('should cancel pending order and release reserved stock', async () => {
      vi.mocked(prisma.order.findFirst).mockResolvedValue({
        id: 'order-100',
        code: 'VTX-1001',
        customerId: 'cust-1',
        storeId: 'store-1',
        status: 'PENDING',
        stockReservations: [
          {
            id: 'res-1',
            storeId: 'store-1',
            variationId: 'var-1',
            lotId: 'lot-1',
            locationId: 'loc-1',
            reservedQuantity: 5,
            status: 'ACTIVE',
          },
        ],
      } as unknown as Awaited<ReturnType<typeof prisma.order.findFirst>>)

      vi.mocked(prisma.order.update).mockResolvedValue({
        id: 'order-100',
        status: 'CANCELLED',
      } as unknown as Awaited<ReturnType<typeof prisma.order.update>>)

      vi.mocked(prisma.productVariation.findUnique).mockResolvedValue({
        id: 'var-1',
        productId: 'prod-1',
      } as unknown as Awaited<
        ReturnType<typeof prisma.productVariation.findUnique>
      >)

      vi.mocked(prisma.stockItem.findFirst).mockResolvedValue({
        id: 'stock-item-1',
        reservedQuantity: 5,
      } as unknown as Awaited<ReturnType<typeof prisma.stockItem.findFirst>>)

      vi.mocked(prisma.stockReservation.update).mockResolvedValue({
        id: 'res-1',
        status: 'RELEASED',
      } as unknown as Awaited<
        ReturnType<typeof prisma.stockReservation.update>
      >)

      vi.mocked(prisma.stockItem.update).mockResolvedValue({
        id: 'stock-item-1',
        reservedQuantity: 2,
      } as unknown as Awaited<ReturnType<typeof prisma.stockItem.update>>)

      const result = await OrdersService.cancelOrder(
        'cust-1',
        'order-100',
        'Desistência da compra',
      )

      expect(result.status).toBe('CANCELLED')
      expect(prisma.stockReservation.update).toHaveBeenCalledWith({
        where: { id: 'res-1' },
        data: { status: 'RELEASED' },
      })

      expect(prisma.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'RELEASE_RESERVATION',
            quantity: 5,
          }),
        }),
      )
    })
  })
})
