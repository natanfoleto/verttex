import { prisma } from '../../infrastructure/database/prisma'
import { logAudit } from '../../shared/utils/audit'
import {
  DispatchOrderInput,
  QuoteShippingInput,
  UpdateTrackingInput,
} from './shipping.schemas'

export class ShippingService {
  /**
   * Calculates shipping quotes and estimated delivery dates based on zipCode.
   */
  static async quoteShipping(input: QuoteShippingInput) {
    // Standard mock calculation based on zipCode region
    const prefix = Number(input.zipCode.substring(0, 2))
    const isExpressEligible = prefix >= 10 && prefix <= 30 // Capital regions

    const standardDays = isExpressEligible ? 3 : 7
    const expressDays = isExpressEligible ? 1 : 3

    const baseWeight = input.items.reduce((acc, i) => acc + i.quantity, 0)
    const standardPrice = Number((15 + baseWeight * 2.5).toFixed(2))
    const expressPrice = Number((29.9 + baseWeight * 4.0).toFixed(2))

    return {
      zipCode: input.zipCode,
      options: [
        {
          id: 'standard',
          name: 'Entrega Padrão',
          carrier: 'VERTTEX Express',
          price: standardPrice,
          deliveryDays: standardDays,
          estimatedDeliveryDate: new Date(
            Date.now() + standardDays * 24 * 60 * 60 * 1000,
          ),
        },
        {
          id: 'express',
          name: 'Entrega Expressa Sanitária',
          carrier: 'VERTTEX Logística Climatizada',
          price: expressPrice,
          deliveryDays: expressDays,
          estimatedDeliveryDate: new Date(
            Date.now() + expressDays * 24 * 60 * 60 * 1000,
          ),
        },
      ],
    }
  }

  /**
   * Dispatches an order, revalidating lot expiration against minimum delivery shelf life,
   * transitioning order to SHIPPED, and logging StockMovement DISPATCH.
   */
  static async dispatchOrder(
    userId: string,
    orderId: string,
    input: DispatchOrderInput,
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        stockReservations: {
          include: {
            lot: true,
          },
        },
        items: true,
      },
    })

    if (!order) {
      throw new Error('Pedido não encontrado')
    }

    if (order.status !== 'PAID' && order.status !== 'CONFIRMED') {
      throw new Error(
        `Não é possível despachar pedido com status '${order.status}'. Somente pedidos pagos/confirmados podem ser despachados`,
      )
    }

    // Revalidate sanitary lot expiration vs minimum delivery shelf life (min 15 days by default)
    const estimatedDeliveryDays = 3
    const minDeliveryShelfLifeDays = 15
    const minRequiredExpiration = new Date(
      Date.now() +
        (estimatedDeliveryDays + minDeliveryShelfLifeDays) *
          24 *
          60 *
          60 *
          1000,
    )

    for (const res of order.stockReservations) {
      if (res.lot && res.lot.expirationDate) {
        if (res.lot.expirationDate < minRequiredExpiration) {
          throw new Error(
            `Despacho bloqueado: O lote '${res.lot.lotNumber}' possui validade (${res.lot.expirationDate.toISOString().split('T')[0]}) inferior à margem sanitária mínima requerida para entrega (${minRequiredExpiration.toISOString().split('T')[0]})`,
          )
        }
      }
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update order status to SHIPPED
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'SHIPPED',
          notes: `Transportadora: ${input.carrierName} | Rastreio: ${input.trackingCode}${input.notes ? ` | ${input.notes}` : ''}`,
        },
      })

      // Record DISPATCH stock movements for each reserved lot
      for (const res of order.stockReservations) {
        if (res.status === 'ACTIVE') {
          await tx.stockReservation.update({
            where: { id: res.id },
            data: { status: 'FULFILLED' },
          })

          await tx.stockMovement.create({
            data: {
              storeId: res.storeId,
              variationId: res.variationId,
              lotId: res.lotId,
              sourceLocationId: res.locationId,
              type: 'DISPATCH',
              quantity: res.reservedQuantity,
              reason: `Expedição de mercadoria do pedido ${order.code} (${input.carrierName})`,
              userId,
            },
          })
        }
      }

      return updated
    })

    await logAudit({
      userId,
      action: 'ORDER_DISPATCH',
      entity: 'Order',
      entityId: orderId,
      newValues: {
        code: order.code,
        carrierName: input.carrierName,
        trackingCode: input.trackingCode,
      },
    })

    return updatedOrder
  }

  /**
   * Updates tracking event for an order.
   */
  static async updateTracking(
    userId: string,
    orderId: string,
    input: UpdateTrackingInput,
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      throw new Error('Pedido não encontrado')
    }

    await logAudit({
      userId,
      action: 'ORDER_TRACKING_UPDATE',
      entity: 'Order',
      entityId: orderId,
      newValues: input,
    })

    return {
      orderId,
      code: order.code,
      status: order.status,
      tracking: input,
    }
  }

  /**
   * Marks an order as DELIVERED.
   */
  static async markAsDelivered(userId: string, orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      throw new Error('Pedido não encontrado')
    }

    if (order.status !== 'SHIPPED') {
      throw new Error(
        'Somente pedidos em trânsito (SHIPPED) podem ser marcados como entregues',
      )
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'DELIVERED',
      },
    })

    await logAudit({
      userId,
      action: 'ORDER_DELIVERED',
      entity: 'Order',
      entityId: orderId,
      newValues: { code: order.code, deliveredAt: new Date() },
    })

    return updatedOrder
  }
}
