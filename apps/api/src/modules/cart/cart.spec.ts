import { beforeEach, describe, expect, it, vi } from 'vitest'

import { prisma } from '../../infrastructure/database/prisma'
import { CartService } from './cart.service'

vi.mock('../../infrastructure/database/prisma', () => ({
  prisma: {
    cart: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    cartItem: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    coupon: {
      findUnique: vi.fn(),
    },
    cartCoupon: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    productVariation: {
      findUnique: vi.fn(),
    },
    stockItem: {
      findMany: vi.fn(),
    },
  },
}))

describe('Cart & Pricing Rules Service Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockOwner = { sessionId: 'session-guest-123' }
  const mockCartId = 'cart-123'

  it('should create active cart if none exists for owner', async () => {
    vi.mocked(prisma.cart.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.cart.create).mockResolvedValue({
      id: mockCartId,
      customerId: null,
      sessionId: 'session-guest-123',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const cart = await CartService.getOrCreateCart(mockOwner)

    expect(prisma.cart.create).toHaveBeenCalled()
    expect(cart.id).toBe(mockCartId)
  })

  it('should calculate cart subtotal grouped by store and apply percentage coupons', async () => {
    vi.mocked(prisma.cart.findFirst).mockResolvedValue({
      id: mockCartId,
      customerId: null,
      sessionId: 'session-guest-123',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    vi.mocked(prisma.cart.findUnique).mockResolvedValue({
      id: mockCartId,
      customerId: null,
      sessionId: 'session-guest-123',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [
        {
          id: 'item-1',
          cartId: mockCartId,
          variationId: 'var-1',
          storeId: 'store-artisan',
          quantity: 2,
          unitPrice: 50.0,
          discount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          store: {
            id: 'store-artisan',
            name: 'Queijos Artesanais',
            slug: 'queijos-artesanais',
            logoUrl: null,
          },
          variation: {
            sku: 'QJ-01',
            product: {
              name: 'Queijo Canastra',
              slug: 'queijo-canastra',
              images: [],
            },
            medias: [],
          },
        },
      ],
      coupons: [
        {
          id: 'cc-1',
          cartId: mockCartId,
          couponId: 'coup-10',
          appliedAt: new Date(),
          coupon: {
            id: 'coup-10',
            code: 'VERTTEX10',
            type: 'PERCENTAGE',
            value: 10,
            minOrderValue: 50,
            maxDiscountAmount: null,
            storeId: null,
            usageLimit: 100,
            usedCount: 5,
            status: 'active',
            expiresAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ],
    } as unknown as Awaited<ReturnType<typeof prisma.cart.findUnique>>)

    const summary = await CartService.getCartSummary(mockOwner)

    expect(summary.subtotal).toBe(100)
    expect(summary.discount).toBe(10)
    expect(summary.total).toBe(90)
    expect(summary.stores).toHaveLength(1)
    expect(summary.stores[0]!.store.name).toBe('Queijos Artesanais')
  })

  it('should throw error if requested quantity exceeds available stock', async () => {
    vi.mocked(prisma.cart.findFirst).mockResolvedValue({
      id: mockCartId,
      customerId: null,
      sessionId: 'session-guest-123',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    vi.mocked(prisma.productVariation.findUnique).mockResolvedValue({
      id: 'var-limited',
      status: 'active',
      price: 100,
      promotionalPrice: null,
      product: { storeId: 'store-1', isPublished: true },
    } as unknown as Awaited<
      ReturnType<typeof prisma.productVariation.findUnique>
    >)

    vi.mocked(prisma.stockItem.findMany).mockResolvedValue([
      {
        id: 's-1',
        physicalQuantity: 2,
        reservedQuantity: 0,
      } as unknown as Awaited<
        ReturnType<typeof prisma.stockItem.findMany>
      >[number],
    ])

    await expect(
      CartService.addItem(mockOwner, 'var-limited', 5),
    ).rejects.toThrow(
      'Quantidade solicitada (5) excede o estoque disponível (2)',
    )
  })
})
