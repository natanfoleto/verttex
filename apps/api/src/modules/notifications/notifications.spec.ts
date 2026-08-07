import { beforeEach, describe, expect, it, vi } from 'vitest'

import { prisma } from '../../infrastructure/database/prisma'
import { NotificationsService } from './notifications.service'

const adminActor = { id: 'user-admin', role: 'admin' }

vi.mock('../../infrastructure/database/prisma', () => ({
  prisma: {
    productLot: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('../../shared/utils/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}))

describe('NotificationsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createNotification & listUserNotifications', () => {
    it('should create and retrieve notifications for a user', async () => {
      const created = await NotificationsService.createNotification(
        'user-test-1',
        'Pedido Confirmado',
        'Seu pedido VTX-1001 foi pago com sucesso',
        'TRANSACTIONAL',
      )

      expect(created.id).toBeDefined()
      expect(created.isRead).toBe(false)

      const list = await NotificationsService.listUserNotifications(
        { id: 'user-test-1', role: 'admin' },
        {
          unreadOnly: false,
        },
      )

      expect(list.notifications.length).toBeGreaterThan(0)
      expect(list.unreadCount).toBeGreaterThan(0)
    })

    it('should mark notification as read', async () => {
      const created = await NotificationsService.createNotification(
        'user-test-2',
        'Alerta',
        'Mensagem de teste',
      )

      const updated = await NotificationsService.markAsRead(
        { id: 'user-test-2', role: 'admin' },
        created.id,
      )
      expect(updated.isRead).toBe(true)
    })
  })

  describe('checkLotExpirations', () => {
    it('should generate sanitary expiration alerts by day brackets and prevent duplicate alerts', async () => {
      const now = Date.now()
      const in10Days = new Date(now + 10 * 24 * 60 * 60 * 1000) // Bracket: 15 days
      const expiredYesterday = new Date(now - 1 * 24 * 60 * 60 * 1000) // Bracket: EXPIRED (0)

      vi.mocked(prisma.productLot.findMany).mockResolvedValue([
        {
          id: 'lot-10days',
          lotNumber: 'LOT-EXP-10D',
          expirationDate: in10Days,
          product: { name: 'Queijo Minas Frescal' },
        },
        {
          id: 'lot-expired',
          lotNumber: 'LOT-EXPIRED-NOW',
          expirationDate: expiredYesterday,
          product: { name: 'Iogurte Natural' },
        },
      ] as unknown as Awaited<ReturnType<typeof prisma.productLot.findMany>>)

      // First run: should trigger alerts for both lots
      const firstCheck = await NotificationsService.checkLotExpirations(
        {
          storeId: 'store-1',
        },
        adminActor,
      )

      expect(firstCheck.scannedLots).toBe(2)
      expect(firstCheck.newAlertsCount).toBe(2)
      expect(
        firstCheck.alerts.some((a) => a.title.includes('LOT-EXP-10D')),
      ).toBe(true)
      expect(
        firstCheck.alerts.some((a) => a.title.includes('LOT-EXPIRED-NOW')),
      ).toBe(true)

      // Second run: deduplication should prevent generating duplicate alerts for the same bracket
      const secondCheck = await NotificationsService.checkLotExpirations(
        {
          storeId: 'store-1',
        },
        adminActor,
      )

      expect(secondCheck.newAlertsCount).toBe(0)
    })
  })
})
