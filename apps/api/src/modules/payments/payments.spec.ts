import { beforeEach, describe, expect, it, vi } from 'vitest'

import { prisma } from '../../infrastructure/database/prisma'
import { PaymentsService } from './payments.service'

vi.mock('../../infrastructure/database/prisma', () => ({
  prisma: {
    order: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    stockReservation: {
      update: vi.fn(),
    },
    stockItem: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    stockMovement: {
      create: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(prisma)),
  },
}))

vi.mock('../../shared/utils/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}))

describe('PaymentsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createCharge', () => {
    it('should generate a Pix payment charge for an active order', async () => {
      vi.mocked(prisma.order.findFirst).mockResolvedValue({
        id: 'order-1',
        code: 'VTX-2026-001',
        customerId: 'cust-1',
        status: 'PENDING',
        paymentStatus: 'pending',
        totalAmount: 150.0,
      } as unknown as Awaited<ReturnType<typeof prisma.order.findUnique>>)

      const result = await PaymentsService.createCharge('cust-1', {
        orderId: 'order-1',
        paymentMethod: 'pix',
      })

      expect(result.orderId).toBe('order-1')
      expect(result.amount).toBe(150.0)
      expect(result.pix.copyPaste).toContain('VTX-2026-001')
      expect(result.pix.qrCodeUrl).toBeDefined()
    })

    it('should throw error if order is not found for customer', async () => {
      vi.mocked(prisma.order.findFirst).mockResolvedValue(null)

      await expect(
        PaymentsService.createCharge('cust-1', {
          orderId: 'invalid-order',
          paymentMethod: 'pix',
        }),
      ).rejects.toThrow('Pedido não encontrado ou não pertence ao cliente')
    })
  })

  describe('processWebhook', () => {
    it('should process PAYMENT_APPROVED webhook and update order status to PAID', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'order-1',
        code: 'VTX-2026-001',
        status: 'PENDING',
        paymentStatus: 'pending',
        stockReservations: [],
      } as unknown as Awaited<ReturnType<typeof prisma.order.findUnique>>)

      vi.mocked(prisma.order.update).mockResolvedValue({
        id: 'order-1',
        status: 'PAID',
        paymentStatus: 'approved',
      } as unknown as Awaited<ReturnType<typeof prisma.order.update>>)

      const result = await PaymentsService.processWebhook({
        eventId: 'evt-approved-123',
        eventType: 'PAYMENT_APPROVED',
        orderId: 'order-1',
        transactionId: 'tx-999',
      })

      expect(result.processed).toBe(true)
      expect(result.newStatus).toBe('PAID')
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order-1' },
          data: { status: 'PAID', paymentStatus: 'approved' },
        }),
      )
    })

    it('should process PAYMENT_FAILED and cancel order releasing FEFO stock reservations', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'order-2',
        code: 'VTX-2026-002',
        status: 'PENDING',
        paymentStatus: 'pending',
        stockReservations: [
          {
            id: 'res-1',
            storeId: 'store-1',
            variationId: 'var-1',
            locationId: 'loc-1',
            lotId: 'lot-1',
            reservedQuantity: 3,
            status: 'ACTIVE',
          },
        ],
      } as unknown as Awaited<ReturnType<typeof prisma.order.findUnique>>)

      vi.mocked(prisma.stockItem.findFirst).mockResolvedValue({
        id: 'stock-item-1',
        reservedQuantity: 3,
      } as unknown as Awaited<ReturnType<typeof prisma.stockItem.findFirst>>)

      const result = await PaymentsService.processWebhook({
        eventId: 'evt-failed-456',
        eventType: 'PAYMENT_FAILED',
        orderId: 'order-2',
      })

      expect(result.processed).toBe(true)
      expect(result.newStatus).toBe('CANCELLED')
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order-2' },
          data: expect.objectContaining({
            status: 'CANCELLED',
            paymentStatus: 'failed',
          }),
        }),
      )
      expect(prisma.stockReservation.update).toHaveBeenCalledWith({
        where: { id: 'res-1' },
        data: { status: 'RELEASED' },
      })
      expect(prisma.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'RELEASE_RESERVATION',
            quantity: 3,
          }),
        }),
      )
    })

    it('should maintain idempotency and ignore duplicate webhook eventId', async () => {
      // Re-send eventId that was processed above
      const result = await PaymentsService.processWebhook({
        eventId: 'evt-approved-123',
        eventType: 'PAYMENT_APPROVED',
        orderId: 'order-1',
      })

      expect(result.processed).toBe(false)
      expect(result.message).toContain('idempotência')
    })
  })
})
