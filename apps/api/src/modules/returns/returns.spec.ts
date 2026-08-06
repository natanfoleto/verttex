import { beforeEach, describe, expect, it, vi } from 'vitest'

import { prisma } from '../../infrastructure/database/prisma'
import { ReturnsService } from './returns.service'

vi.mock('../../infrastructure/database/prisma', () => ({
  prisma: {
    order: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    orderItem: {
      findUnique: vi.fn(),
    },
    stockMovement: {
      create: vi.fn(),
    },
  },
}))

vi.mock('../../shared/utils/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}))

describe('ReturnsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('requestReturn', () => {
    it('should create a return request for a delivered order', async () => {
      vi.mocked(prisma.order.findFirst).mockResolvedValue({
        id: 'order-del-1',
        code: 'VTX-DEL-1',
        customerId: 'cust-1',
        storeId: 'store-1',
        status: 'DELIVERED',
      } as unknown as Awaited<ReturnType<typeof prisma.order.findFirst>>)

      const result = await ReturnsService.requestReturn('cust-1', {
        orderId: 'order-del-1',
        reason: 'Embalagem avariada no transporte',
        items: [{ orderItemId: 'item-1', quantity: 1 }],
      })

      expect(result.id).toBeDefined()
      expect(result.status).toBe('REQUESTED')
      expect(result.reason).toBe('Embalagem avariada no transporte')
    })

    it('should throw error if order status is not DELIVERED or SHIPPED', async () => {
      vi.mocked(prisma.order.findFirst).mockResolvedValue({
        id: 'order-pending-1',
        customerId: 'cust-1',
        status: 'PENDING',
      } as unknown as Awaited<ReturnType<typeof prisma.order.findFirst>>)

      await expect(
        ReturnsService.requestReturn('cust-1', {
          orderId: 'order-pending-1',
          reason: 'Desistência',
          items: [{ orderItemId: 'item-1', quantity: 1 }],
        }),
      ).rejects.toThrow(
        'Somente pedidos entregues ou em transporte podem ser objeto de solicitação de devolução',
      )
    })
  })

  describe('receiveReturnInQuarantine & inspectAndReleaseQuarantine', () => {
    it('should process return into quarantine and then perform approved sanitary inspection release', async () => {
      // Step 1: Create request
      vi.mocked(prisma.order.findFirst).mockResolvedValue({
        id: 'order-del-2',
        code: 'VTX-DEL-2',
        customerId: 'cust-1',
        storeId: 'store-1',
        status: 'DELIVERED',
      } as unknown as Awaited<ReturnType<typeof prisma.order.findFirst>>)

      const ret = await ReturnsService.requestReturn('cust-1', {
        orderId: 'order-del-2',
        reason: 'Produto lacrado com suspeita de variação de cor',
        items: [{ orderItemId: 'item-2', quantity: 1 }],
      })

      vi.mocked(prisma.orderItem.findUnique).mockResolvedValue({
        id: 'item-2',
        variationId: 'var-2',
      } as unknown as Awaited<ReturnType<typeof prisma.orderItem.findUnique>>)

      // Step 2: Receive into compulsory quarantine
      const quarantined = await ReturnsService.receiveReturnInQuarantine(
        'user-auditor',
        ret.id,
        { notes: 'Armazenado na câmara fria 2 de quarentena' },
      )

      expect(quarantined.status).toBe('QUARANTINED')
      expect(prisma.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'CUSTOMER_RETURN',
            quantity: 1,
          }),
        }),
      )

      // Step 3: Inspect and release for sale
      const inspected = await ReturnsService.inspectAndReleaseQuarantine(
        'user-auditor',
        ret.id,
        {
          decision: 'APPROVED_FOR_SALE',
          notes:
            'Inspeção sanitária física e organoléptica aprovada sem anomalias',
        },
      )

      expect(inspected.status).toBe('INSPECTED_PASSED')
      expect(prisma.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'QUARANTINE_RELEASE',
            quantity: 1,
          }),
        }),
      )
    })

    it('should process quarantine inspection failure and log damage discard', async () => {
      vi.mocked(prisma.order.findFirst).mockResolvedValue({
        id: 'order-del-3',
        code: 'VTX-DEL-3',
        customerId: 'cust-1',
        storeId: 'store-1',
        status: 'DELIVERED',
      } as unknown as Awaited<ReturnType<typeof prisma.order.findFirst>>)

      const ret = await ReturnsService.requestReturn('cust-1', {
        orderId: 'order-del-3',
        reason: 'Selo rompidos',
        items: [{ orderItemId: 'item-3', quantity: 1 }],
      })

      vi.mocked(prisma.orderItem.findUnique).mockResolvedValue({
        id: 'item-3',
        variationId: 'var-3',
      } as unknown as Awaited<ReturnType<typeof prisma.orderItem.findUnique>>)

      await ReturnsService.receiveReturnInQuarantine('user-auditor', ret.id, {})

      const inspected = await ReturnsService.inspectAndReleaseQuarantine(
        'user-auditor',
        ret.id,
        {
          decision: 'DISCARD_DAMAGE',
          notes:
            'Produto com violação de lacre sanitário. Encaminhado para descarte por avaria',
        },
      )

      expect(inspected.status).toBe('INSPECTED_DISCARDED')
      expect(prisma.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'DAMAGE_DISCARD',
            quantity: 1,
          }),
        }),
      )
    })
  })

  describe('processRefund', () => {
    it('should update order paymentStatus to refunded and return status to REFUNDED', async () => {
      vi.mocked(prisma.order.findFirst).mockResolvedValue({
        id: 'order-del-4',
        code: 'VTX-DEL-4',
        customerId: 'cust-1',
        storeId: 'store-1',
        status: 'DELIVERED',
      } as unknown as Awaited<ReturnType<typeof prisma.order.findFirst>>)

      const ret = await ReturnsService.requestReturn('cust-1', {
        orderId: 'order-del-4',
        reason: 'Devolução aceita',
        items: [{ orderItemId: 'item-4', quantity: 1 }],
      })

      vi.mocked(prisma.order.update).mockResolvedValue({
        id: 'order-del-4',
        paymentStatus: 'refunded',
      } as unknown as Awaited<ReturnType<typeof prisma.order.update>>)

      const result = await ReturnsService.processRefund('user-1', ret.id, {
        amount: 89.9,
        reason: 'Reembolso Pix realizado',
      })

      expect(result.status).toBe('REFUNDED')
      expect(result.refundAmount).toBe(89.9)
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-del-4' },
        data: { paymentStatus: 'refunded' },
      })
    })
  })
})
