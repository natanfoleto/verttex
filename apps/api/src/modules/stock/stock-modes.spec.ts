import { beforeEach, describe, expect, it, vi } from 'vitest'

import { prisma } from '../../infrastructure/database/prisma'
import { LotsService } from '../lots/lots.service'
import type { ReceiveStockBody } from './stock.schemas'
import { resolveStockMode, StockService } from './stock.service'

const adminActor = { id: 'user-1', role: 'admin' }

vi.mock('../../infrastructure/database/prisma', () => ({
  prisma: {
    productVariation: {
      findFirst: vi.fn(),
    },
    inventoryLocation: {
      upsert: vi.fn(),
    },
    productLot: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    stockItem: {
      upsert: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    stockMovement: {
      create: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}))

vi.mock('../../shared/utils/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}))

describe('Stock Control Modes & Lot Tracking Tests (Fase 2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Stock Mode Resolution Helper', () => {
    it('should default to SIMPLE when no mode is defined', () => {
      expect(resolveStockMode({ stockMode: null }, { stockMode: null })).toBe(
        'SIMPLE',
      )
    })

    it('should resolve NOT_TRACKED when explicitly defined', () => {
      expect(resolveStockMode({ stockMode: 'NOT_TRACKED' })).toBe('NOT_TRACKED')
      expect(
        resolveStockMode({ stockMode: 'SIMPLE' }, { stockMode: 'NOT_TRACKED' }),
      ).toBe('NOT_TRACKED')
    })

    it('should allow variation stockMode to override product stockMode', () => {
      expect(
        resolveStockMode(
          { stockMode: 'SIMPLE' },
          { stockMode: 'BATCH_WITH_EXPIRATION' },
        ),
      ).toBe('BATCH_WITH_EXPIRATION')
    })

    it('should resolve legacy boolean flags correctly', () => {
      expect(
        resolveStockMode({
          hasExpirationControl: true,
          isExpirationRequired: true,
        }),
      ).toBe('BATCH_WITH_EXPIRATION')
      expect(resolveStockMode({ hasBatchControl: true })).toBe('BATCH')
    })
  })

  describe('Internal Lot Generation & Stock Modes Validation', () => {
    it('should generate internal lot number format INT-YYYYMMDD-XXXX', () => {
      const internalLot = LotsService.generateInternalLotNumber()
      expect(internalLot).toMatch(/^INT-\d{8}-\d{4}$/)
    })

    it('should return early without creating stock items for NOT_TRACKED mode', async () => {
      vi.mocked(prisma.productVariation.findFirst).mockResolvedValue({
        id: 'var-not-tracked',
        product: { storeId: 'store-1', stockMode: 'NOT_TRACKED' },
      } as unknown as Awaited<
        ReturnType<typeof prisma.productVariation.findFirst>
      >)

      const result = await StockService.receiveStock(
        {
          storeId: 'store-1',
          variationId: 'var-not-tracked',
          lots: [{ quantity: 10 }],
        } as unknown as ReceiveStockBody,
        adminActor,
      )

      expect(result.message).toContain('NOT_TRACKED')
      expect(prisma.stockItem.upsert).not.toHaveBeenCalled()
    })

    it('should throw error if expirationDate is missing in BATCH_WITH_EXPIRATION mode', async () => {
      vi.mocked(prisma.productVariation.findFirst).mockResolvedValue({
        id: 'var-exp-req',
        product: { storeId: 'store-1', stockMode: 'BATCH_WITH_EXPIRATION' },
      } as unknown as Awaited<
        ReturnType<typeof prisma.productVariation.findFirst>
      >)

      vi.mocked(prisma.inventoryLocation.upsert).mockResolvedValue({
        id: 'loc-1',
      } as unknown as Awaited<
        ReturnType<typeof prisma.inventoryLocation.upsert>
      >)

      await expect(
        StockService.receiveStock(
          {
            storeId: 'store-1',
            variationId: 'var-exp-req',
            lots: [{ lotNumber: 'LOTE-100', quantity: 5 }], // missing expirationDate
          } as unknown as ReceiveStockBody,
          adminActor,
        ),
      ).rejects.toThrow(
        'Data de validade é obrigatória para produtos no modo BATCH_WITH_EXPIRATION',
      )
    })

    it('should auto-generate internal lot number when provider lot is omitted in BATCH mode', async () => {
      vi.mocked(prisma.productVariation.findFirst).mockResolvedValue({
        id: 'var-batch',
        product: { storeId: 'store-1', stockMode: 'BATCH' },
      } as unknown as Awaited<
        ReturnType<typeof prisma.productVariation.findFirst>
      >)

      vi.mocked(prisma.inventoryLocation.upsert).mockResolvedValue({
        id: 'loc-1',
      } as unknown as Awaited<
        ReturnType<typeof prisma.inventoryLocation.upsert>
      >)

      vi.mocked(prisma.productLot.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.productLot.create).mockResolvedValue({
        id: 'created-lot-id',
        lotNumber: 'INT-20260727-1234',
      } as unknown as Awaited<ReturnType<typeof prisma.productLot.create>>)
      vi.mocked(prisma.stockItem.upsert).mockResolvedValue({
        id: 'stock-1',
      } as unknown as Awaited<ReturnType<typeof prisma.stockItem.upsert>>)

      const res = await StockService.receiveStock(
        {
          storeId: 'store-1',
          variationId: 'var-batch',
          lots: [{ quantity: 20 }], // no lotNumber provided
        } as unknown as ReceiveStockBody,
        adminActor,
      )

      expect(res.success).toBe(true)
      expect(prisma.productLot.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            lotNumber: expect.stringMatching(/^INT-\d{8}-\d{4}$/),
          }),
        }),
      )
    })
  })
})
