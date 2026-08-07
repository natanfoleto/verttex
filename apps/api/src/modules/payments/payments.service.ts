import { prisma } from '../../infrastructure/database/prisma'
import { logAudit } from '../../shared/utils/audit'
import { CreatePaymentChargeInput, WebhookEventInput } from './payments.schemas'

// Development prototype only: process-local idempotency, not shared or durable.
const processedWebhooks = new Set<string>()

export class PaymentsService {
  /**
   * Generates a payment charge for an order (Pix QR code / CopyPaste or Credit Card metadata).
   */
  static async createCharge(
    customerId: string,
    input: CreatePaymentChargeInput,
  ) {
    const order = await prisma.order.findFirst({
      where: {
        id: input.orderId,
        customerId,
      },
    })

    if (!order) {
      throw new Error('Pedido não encontrado ou não pertence ao cliente')
    }

    if (order.status === 'CANCELLED') {
      throw new Error('Não é possível gerar cobrança para um pedido cancelado')
    }

    if (order.paymentStatus === 'approved') {
      throw new Error('Este pedido já se encontra pago')
    }

    const amount = Number(order.totalAmount)
    const pixCopyPaste = `00020126580014br.gov.bcb.pix0136${order.code}5204000053039865405${amount.toFixed(2)}5802BR5913VERTTEX LOJA6008BRASILIA62070503***63041234`
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 min expiration

    return {
      orderId: order.id,
      orderCode: order.code,
      paymentMethod: input.paymentMethod,
      amount,
      pix: {
        copyPaste: pixCopyPaste,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixCopyPaste)}`,
        expiresAt,
      },
      status: order.paymentStatus,
    }
  }

  /**
   * Processes gateway webhook events idempotently.
   */
  static async processWebhook(eventPayload: WebhookEventInput) {
    const { eventId, eventType, orderId, transactionId } = eventPayload

    // Idempotency check: if event was already processed, ignore gracefully
    if (processedWebhooks.has(eventId)) {
      return {
        processed: false,
        message: 'Evento de webhook já processado anteriormente (idempotência)',
        eventId,
      }
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { stockReservations: true },
    })

    if (!order) {
      throw new Error(`Pedido com ID ${orderId} não foi encontrado`)
    }

    processedWebhooks.add(eventId)

    if (eventType === 'PAYMENT_APPROVED') {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: orderId },
          data: {
            status: 'PAID',
            paymentStatus: 'approved',
          },
        })
      })

      await logAudit({
        action: 'PAYMENT_APPROVED',
        entity: 'Order',
        entityId: orderId,
        newValues: { eventId, transactionId, code: order.code },
      })

      return {
        processed: true,
        orderId,
        newStatus: 'PAID',
        paymentStatus: 'approved',
      }
    }

    if (eventType === 'PAYMENT_FAILED' || eventType === 'PAYMENT_EXPIRED') {
      await prisma.$transaction(async (tx) => {
        // Update order status to CANCELLED and paymentStatus
        const paymentStatus =
          eventType === 'PAYMENT_EXPIRED' ? 'expired' : 'failed'
        await tx.order.update({
          where: { id: orderId },
          data: {
            status: 'CANCELLED',
            paymentStatus,
            cancelReason: `Pagamento ${eventType === 'PAYMENT_EXPIRED' ? 'expirado' : 'recusado'} via Webhook`,
          },
        })

        // Release atomic FEFO stock reservations
        const activeReservations = order.stockReservations.filter(
          (r) => r.status === 'ACTIVE',
        )

        for (const res of activeReservations) {
          await tx.stockReservation.update({
            where: { id: res.id },
            data: { status: 'RELEASED' },
          })

          // Decrement reservedQuantity on stockItem if present
          const stockItem = await tx.stockItem.findFirst({
            where: {
              storeId: res.storeId,
              variationId: res.variationId,
              locationId: res.locationId,
            },
          })

          if (stockItem) {
            await tx.stockItem.update({
              where: { id: stockItem.id },
              data: {
                reservedQuantity: Math.max(
                  0,
                  stockItem.reservedQuantity - res.reservedQuantity,
                ),
              },
            })

            await tx.stockMovement.create({
              data: {
                storeId: res.storeId,
                variationId: res.variationId,
                sourceLocationId: res.locationId,
                lotId: res.lotId,
                type: 'RELEASE_RESERVATION',
                quantity: res.reservedQuantity,
                reason: `Liberação de reserva por pagamento ${paymentStatus} (Order ${order.code})`,
              },
            })
          }
        }
      })

      await logAudit({
        action: 'PAYMENT_FAILED',
        entity: 'Order',
        entityId: orderId,
        newValues: { eventId, eventType, code: order.code },
      })

      return {
        processed: true,
        orderId,
        newStatus: 'CANCELLED',
        paymentStatus: eventType === 'PAYMENT_EXPIRED' ? 'expired' : 'failed',
      }
    }

    return {
      processed: true,
      orderId,
      message: 'Evento recebido sem alteração de status necessária',
    }
  }

  /**
   * Retrieves current payment status for an order.
   */
  static async getPaymentStatus(customerId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, customerId },
      select: {
        id: true,
        code: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        totalAmount: true,
        updatedAt: true,
      },
    })

    if (!order) {
      throw new Error('Pedido não encontrado ou não pertence ao cliente')
    }

    return order
  }
}
