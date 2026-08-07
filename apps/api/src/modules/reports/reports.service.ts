import { Prisma } from '@prisma/client'

import { prisma } from '../../infrastructure/database/prisma'
import {
  StoreAccessActor,
  StoreAccessPolicy,
} from '../../shared/policies/store-access.policy'
import { logAudit } from '../../shared/utils/audit'
import { DateRangeQueryInput, ExportReportsQueryInput } from './reports.schemas'

export class ReportsService {
  /**
   * Calculates total sales revenue, order count, and average ticket size.
   */
  static async getSalesSummary(
    query: DateRangeQueryInput,
    actor: StoreAccessActor,
  ) {
    const whereCondition: Prisma.OrderWhereInput = {
      status: { in: ['PAID', 'CONFIRMED', 'SHIPPED', 'DELIVERED'] },
    }

    const storeFilter = await StoreAccessPolicy.resolveStoreFilter(
      actor,
      query.storeId,
    )
    if (storeFilter) whereCondition.storeId = storeFilter

    if (query.startDate || query.endDate) {
      whereCondition.createdAt = {}
      if (query.startDate)
        whereCondition.createdAt.gte = new Date(query.startDate)
      if (query.endDate) whereCondition.createdAt.lte = new Date(query.endDate)
    }

    const orders = await prisma.order.findMany({
      where: whereCondition,
      select: {
        totalAmount: true,
      },
    })

    const orderCount = orders.length
    const totalRevenue = orders.reduce(
      (sum, o) => sum + Number(o.totalAmount),
      0,
    )
    const averageTicket =
      orderCount > 0 ? Number((totalRevenue / orderCount).toFixed(2)) : 0

    return {
      storeId:
        query.storeId ||
        (StoreAccessPolicy.hasGlobalAccess(actor)
          ? 'ALL_STORES'
          : 'ALL_ACCESSIBLE_STORES'),
      orderCount,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      averageTicket,
    }
  }

  /**
   * Calculates top selling products and classifies into ABC Curve (A: 80%, B: 15%, C: 5%).
   */
  static async getTopProductsAndAbc(
    query: DateRangeQueryInput,
    actor: StoreAccessActor,
  ) {
    const whereCondition: Prisma.OrderItemWhereInput = {
      order: {
        status: { in: ['PAID', 'CONFIRMED', 'SHIPPED', 'DELIVERED'] },
      },
    }

    const storeFilter = await StoreAccessPolicy.resolveStoreFilter(
      actor,
      query.storeId,
    )
    if (storeFilter && whereCondition.order) {
      whereCondition.order.storeId = storeFilter
    }

    const items = await prisma.orderItem.findMany({
      where: whereCondition,
      select: {
        productId: true,
        productName: true,
        sku: true,
        quantity: true,
        subtotal: true,
      },
    })

    // Group items by productId
    const map = new Map<
      string,
      {
        productId: string
        name: string
        sku: string
        quantity: number
        revenue: number
      }
    >()

    for (const item of items) {
      const existing = map.get(item.productId) || {
        productId: item.productId,
        name: item.productName,
        sku: item.sku,
        quantity: 0,
        revenue: 0,
      }
      existing.quantity += item.quantity
      existing.revenue += Number(item.subtotal)
      map.set(item.productId, existing)
    }

    const sortedProducts = Array.from(map.values()).sort(
      (a, b) => b.revenue - a.revenue,
    )
    const grandTotalRevenue = sortedProducts.reduce(
      (sum, p) => sum + p.revenue,
      0,
    )

    let runningSum = 0
    const abcProducts = sortedProducts.map((p) => {
      runningSum += p.revenue
      const cumulativePercent =
        grandTotalRevenue > 0 ? (runningSum / grandTotalRevenue) * 100 : 0
      let category: 'A' | 'B' | 'C' = 'C'
      if (cumulativePercent <= 80) category = 'A'
      else if (cumulativePercent <= 95) category = 'B'

      return {
        ...p,
        revenue: Number(p.revenue.toFixed(2)),
        cumulativePercent: Number(cumulativePercent.toFixed(1)),
        category,
      }
    })

    return {
      storeId:
        query.storeId ||
        (StoreAccessPolicy.hasGlobalAccess(actor)
          ? 'ALL_STORES'
          : 'ALL_ACCESSIBLE_STORES'),
      totalProducts: abcProducts.length,
      grandTotalRevenue: Number(grandTotalRevenue.toFixed(2)),
      products: abcProducts,
    }
  }

  /**
   * Generates inventory losses report aggregated by discard reason (Damage vs Expiration).
   */
  static async getInventoryLossesReport(
    query: DateRangeQueryInput,
    actor: StoreAccessActor,
  ) {
    const whereCondition: Prisma.StockMovementWhereInput = {
      type: { in: ['DAMAGE_DISCARD', 'EXPIRATION_DISCARD'] },
    }

    const storeFilter = await StoreAccessPolicy.resolveStoreFilter(
      actor,
      query.storeId,
    )
    if (storeFilter) whereCondition.storeId = storeFilter

    const movements = await prisma.stockMovement.findMany({
      where: whereCondition,
      select: {
        type: true,
        quantity: true,
        reason: true,
        createdAt: true,
      },
    })

    const damageTotal = movements
      .filter((m) => m.type === 'DAMAGE_DISCARD')
      .reduce((sum, m) => sum + m.quantity, 0)

    const expirationTotal = movements
      .filter((m) => m.type === 'EXPIRATION_DISCARD')
      .reduce((sum, m) => sum + m.quantity, 0)

    return {
      storeId:
        query.storeId ||
        (StoreAccessPolicy.hasGlobalAccess(actor)
          ? 'ALL_STORES'
          : 'ALL_ACCESSIBLE_STORES'),
      totalDiscardedQuantity: damageTotal + expirationTotal,
      byReason: {
        damageDiscard: damageTotal,
        expirationDiscard: expirationTotal,
      },
      movementsCount: movements.length,
    }
  }

  /**
   * Exports consolidated report in CSV or JSON format with audit logging.
   */
  static async exportReport(
    actor: StoreAccessActor,
    query: ExportReportsQueryInput,
  ) {
    const sales = await this.getSalesSummary({ storeId: query.storeId }, actor)
    const losses = await this.getInventoryLossesReport(
      {
        storeId: query.storeId,
      },
      actor,
    )

    await logAudit({
      userId: actor.id,
      action: 'REPORT_EXPORT',
      entity: 'Report',
      newValues: { format: query.format, storeId: query.storeId },
    })

    if (query.format === 'csv') {
      const csvLines = [
        'Métrica,Valor',
        `Faturamento Total R$,${sales.totalRevenue}`,
        `Total de Pedidos,${sales.orderCount}`,
        `Ticket Médio R$,${sales.averageTicket}`,
        `Descartes por Validade (Qtd),${losses.byReason.expirationDiscard}`,
        `Descartes por Avaria (Qtd),${losses.byReason.damageDiscard}`,
      ]
      return {
        format: 'csv',
        contentType: 'text/csv',
        content: csvLines.join('\n'),
      }
    }

    return {
      format: 'json',
      contentType: 'application/json',
      content: JSON.stringify({ sales, losses }, null, 2),
    }
  }
}
