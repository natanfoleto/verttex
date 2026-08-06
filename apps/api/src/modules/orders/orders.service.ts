import { Prisma } from '@prisma/client'

import { prisma } from '../../infrastructure/database/prisma'
import { AppError } from '../../shared/errors/app-error'
import { logAudit } from '../../shared/utils/audit'
import { ProductsService } from '../products/products.service'
import { StockService } from '../stock/stock.service'
import { CheckoutBodyInput, ListOrdersQueryInput } from './orders.schemas'

export class OrdersService {
  /**
   * Executa o checkout atômico:
   * 1. Valida itens no carrinho do cliente.
   * 2. Verifica se o endereço pertence ao cliente.
   * 3. Aloca lotes via algoritmo FEFO (First Expired, First Out).
   * 4. Grava snapshot imutável do produto, variação e impostos no OrderItem.
   * 5. Cria reservas de estoque e movimentos de auditoria (StockMovement.RESERVATION).
   * 6. Limpa o carrinho do comprador.
   */
  static async checkout(customerId: string, input: CheckoutBodyInput) {
    // 1. Buscar carrinho do cliente
    const cart = await prisma.cart.findFirst({
      where: { customerId },
      include: {
        items: {
          include: {
            variation: {
              include: {
                product: {
                  include: {
                    medias: {
                      include: {
                        file: true,
                      },
                    },
                  },
                },
                values: {
                  include: {
                    optionValue: {
                      include: {
                        option: true,
                      },
                    },
                  },
                },
                medias: {
                  include: {
                    file: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!cart || cart.items.length === 0) {
      throw new AppError('VALIDATION_ERROR', 'Seu carrinho está vazio', 400)
    }

    // 2. Validar endereço de entrega do cliente
    const address = await prisma.customerAddress.findFirst({
      where: {
        id: input.customerAddressId,
        customerId,
      },
    })

    if (!address) {
      throw new AppError(
        'NOT_FOUND',
        'Endereço de entrega não encontrado ou não pertence a esta conta',
        404,
      )
    }

    const firstItem = cart.items[0]
    if (!firstItem) {
      throw new AppError('VALIDATION_ERROR', 'Carrinho sem itens', 400)
    }

    const storeId = firstItem.storeId || firstItem.variation.storeId

    // 3. Verificar disponibilidade de estoque e calcular alocações FEFO para cada item
    const itemAllocations: {
      cartItem: (typeof cart.items)[0]
      allocatedLots: { lotId: string; locationId: string; quantity: number }[]
      effectiveFiscal: NonNullable<
        Awaited<ReturnType<typeof ProductsService.resolveEffectiveFiscalData>>
      >
      unitPrice: number
    }[] = []

    let subtotalAmount = 0

    for (const item of cart.items) {
      const variation = item.variation
      const product = variation.product

      const stockMode = StockService.resolveStockMode(product, variation)

      const availability = (await StockService.queryCommercialAvailability({
        storeId,
        variationId: variation.id,
        requestedQuantity: item.quantity,
      })) as {
        totalCommercialAvailable: number
        isFulfillable: boolean
        fefoAllocations: Array<{
          lotId?: string
          location?: { id: string }
          locationId?: string
          allocatedQuantity: number
        }>
      }

      if (
        stockMode !== 'NOT_TRACKED' &&
        availability.totalCommercialAvailable < item.quantity
      ) {
        throw new AppError(
          'VALIDATION_ERROR',
          `Estoque insuficiente para o produto "${product.name}". Disponível: ${availability.totalCommercialAvailable}, Solicitado: ${item.quantity}`,
          400,
        )
      }

      const allocatedLots: {
        lotId: string
        locationId: string
        quantity: number
      }[] = []

      if (stockMode === 'BATCH' || stockMode === 'BATCH_WITH_EXPIRATION') {
        if (!availability.isFulfillable) {
          throw new AppError(
            'VALIDATION_ERROR',
            `Não foi possível alocar lotes válidos suficientes para "${product.name}" via FEFO.`,
            400,
          )
        }

        for (const fefoAlloc of availability.fefoAllocations) {
          allocatedLots.push({
            lotId: fefoAlloc.lotId || '',
            locationId:
              fefoAlloc.location?.id || fefoAlloc.locationId || 'loc-default',
            quantity: fefoAlloc.allocatedQuantity,
          })
        }
      } else if (stockMode === 'SIMPLE') {
        const defaultStockItem = await prisma.stockItem.findFirst({
          where: { variationId: variation.id, storeId },
        })

        const locationId = defaultStockItem?.locationId || 'loc-default'

        allocatedLots.push({
          lotId: defaultStockItem?.lotId || '',
          locationId,
          quantity: item.quantity,
        })
      }

      const effectiveFiscal = await ProductsService.resolveEffectiveFiscalData(
        variation.id,
      )
      if (!effectiveFiscal) {
        throw new AppError(
          'INTERNAL_ERROR',
          `Falha ao resolver dados fiscais para variante ${variation.id}`,
          500,
        )
      }

      const unitPrice = Number(variation.promotionalPrice || variation.price)
      subtotalAmount += unitPrice * item.quantity

      itemAllocations.push({
        cartItem: item,
        allocatedLots,
        effectiveFiscal,
        unitPrice,
      })
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const randomCode = Math.floor(1000 + Math.random() * 9000)
    const orderCode = `VTX-${dateStr}-${randomCode}`

    // 4. Executar transação atômica Prisma
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          code: orderCode,
          storeId,
          customerId,
          customerAddressId: address.id,
          status: 'PENDING',
          subtotal: subtotalAmount,
          shippingFee: 0,
          discount: 0,
          totalAmount: subtotalAmount,
          paymentMethod: input.paymentMethod,
          paymentStatus: 'pending',
          notes: input.notes || null,
        },
      })

      for (const alloc of itemAllocations) {
        const { cartItem, allocatedLots, effectiveFiscal, unitPrice } = alloc
        const variation = cartItem.variation
        const product = variation.product

        const variationOptionsStr =
          variation.values
            .map((v) => `${v.optionValue.option.name}: ${v.optionValue.value}`)
            .join(' / ') || `SKU: ${variation.sku}`

        const mainMedia =
          variation.medias.find((m) => m.isMain) ||
          product.medias.find((m) => m.isMain) ||
          product.medias[0]

        const mainImage = mainMedia?.file?.objectKey
          ? `${process.env.R2_PUBLIC_URL || ''}/${mainMedia.file.objectKey}`
          : null

        const itemSubtotal = unitPrice * cartItem.quantity

        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: product.id,
            variationId: variation.id,
            productName: product.name,
            variationName: variationOptionsStr,
            sku: variation.sku,
            price: unitPrice,
            costPrice: variation.costPrice ? Number(variation.costPrice) : null,
            quantity: cartItem.quantity,
            subtotal: itemSubtotal,
            imageUrl: mainImage,
            ncm: effectiveFiscal.ncm || null,
            cest: effectiveFiscal.cest || null,
            fiscalOrigin: effectiveFiscal.fiscalOrigin ?? null,
            commercialUnit: effectiveFiscal.commercialUnit || null,
            taxableUnit: effectiveFiscal.taxableUnit || null,
          },
        })

        for (const lotAlloc of allocatedLots) {
          if (lotAlloc.lotId) {
            await tx.orderItemLot.create({
              data: {
                orderItemId: orderItem.id,
                lotId: lotAlloc.lotId,
                quantity: lotAlloc.quantity,
              },
            })
          }

          const reservationExpiresAt = new Date(Date.now() + 30 * 60 * 1000)

          await tx.stockReservation.create({
            data: {
              storeId,
              orderId: order.id,
              variationId: variation.id,
              lotId: lotAlloc.lotId || null,
              locationId: lotAlloc.locationId,
              reservedQuantity: lotAlloc.quantity,
              status: 'ACTIVE',
              expiresAt: reservationExpiresAt,
            },
          })

          const stockItem = await tx.stockItem.findFirst({
            where: {
              storeId,
              variationId: variation.id,
              locationId: lotAlloc.locationId,
              lotId: lotAlloc.lotId || null,
            },
          })

          if (stockItem) {
            await tx.stockItem.update({
              where: { id: stockItem.id },
              data: {
                reservedQuantity: { increment: lotAlloc.quantity },
              },
            })
          }

          await tx.stockMovement.create({
            data: {
              storeId,
              variationId: variation.id,
              lotId: lotAlloc.lotId || null,
              sourceLocationId: lotAlloc.locationId,
              type: 'RESERVATION',
              quantity: lotAlloc.quantity,
              reason: `Reserva atômica de checkout FEFO para o Pedido ${order.code}`,
              referenceId: `ORDER:${order.code}`,
              userId: customerId,
            },
          })
        }
      }

      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      })

      await logAudit({
        userId: customerId,
        action: 'ORDER_CHECKOUT',
        entity: 'Order',
        entityId: order.id,
        newValues: {
          storeId,
          code: order.code,
          totalAmount: order.totalAmount,
          itemCount: cart.items.length,
          paymentMethod: order.paymentMethod,
        },
      })

      return order
    })
  }

  static async listCustomerOrders(
    customerId: string,
    query: ListOrdersQueryInput,
  ) {
    const { page, limit, status } = query
    const skip = (page - 1) * limit

    const where: Prisma.OrderWhereInput = { customerId }
    if (status) where.status = status

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          store: {
            select: { id: true, name: true, logoUrl: true, slug: true },
          },
          items: true,
        },
      }),
      prisma.order.count({ where }),
    ])

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  static async getOrderDetails(customerId: string, orderIdOrCode: string) {
    const order = await prisma.order.findFirst({
      where: {
        customerId,
        OR: [{ id: orderIdOrCode }, { code: orderIdOrCode }],
      },
      include: {
        store: {
          select: { id: true, name: true, logoUrl: true, slug: true },
        },
        address: true,
        items: {
          include: {
            itemLots: {
              include: {
                lot: true,
              },
            },
          },
        },
      },
    })

    if (!order) {
      throw new AppError('NOT_FOUND', 'Pedido não encontrado', 404)
    }

    return order
  }

  static async cancelOrder(
    customerId: string,
    orderId: string,
    cancelReason?: string,
  ) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, customerId },
      include: {
        stockReservations: true,
      },
    })

    if (!order) {
      throw new AppError('NOT_FOUND', 'Pedido não encontrado', 404)
    }

    if (order.status === 'CANCELLED') {
      throw new AppError(
        'VALIDATION_ERROR',
        'Este pedido já foi cancelado',
        400,
      )
    }

    if (order.status === 'SHIPPED' || order.status === 'DELIVERED') {
      throw new AppError(
        'VALIDATION_ERROR',
        'Não é possível cancelar um pedido que já foi enviado ou entregue',
        400,
      )
    }

    return await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'failed',
          cancelReason: cancelReason || 'Cancelado pelo cliente',
        },
      })

      for (const res of order.stockReservations) {
        if (res.status === 'ACTIVE') {
          await tx.stockReservation.update({
            where: { id: res.id },
            data: { status: 'RELEASED' },
          })

          const stockItem = await tx.stockItem.findFirst({
            where: {
              storeId: res.storeId,
              variationId: res.variationId,
              locationId: res.locationId,
              lotId: res.lotId || null,
            },
          })

          if (stockItem) {
            await tx.stockItem.update({
              where: { id: stockItem.id },
              data: {
                reservedQuantity: {
                  decrement: Math.min(
                    stockItem.reservedQuantity,
                    res.reservedQuantity,
                  ),
                },
              },
            })
          }

          await tx.stockMovement.create({
            data: {
              storeId: res.storeId,
              variationId: res.variationId,
              lotId: res.lotId || null,
              sourceLocationId: res.locationId,
              type: 'RELEASE_RESERVATION',
              quantity: res.reservedQuantity,
              reason: `Liberação de reserva devido a cancelamento do pedido ${order.code}`,
              referenceId: `CANCEL:${order.code}`,
              userId: customerId,
            },
          })
        }
      }

      await logAudit({
        userId: customerId,
        action: 'ORDER_CANCEL',
        entity: 'Order',
        entityId: order.id,
        newValues: {
          storeId: order.storeId,
          code: order.code,
          cancelReason: cancelReason || 'Cancelado pelo cliente',
        },
      })

      return updatedOrder
    })
  }

  static async listManagerOrders(query: {
    status?: string
    search?: string
    page?: string | number
    limit?: string | number
    perPage?: string | number
  }) {
    const page = Math.max(1, Number(query.page) || 1)
    const perPage = Math.max(
      1,
      Math.min(100, Number(query.perPage || query.limit) || 10),
    )
    const skip = (page - 1) * perPage

    const where: Prisma.OrderWhereInput = {}
    if (query.status && query.status !== 'ALL') {
      where.status = query.status
    }
    if (query.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { customer: { name: { contains: query.search, mode: 'insensitive' } } },
      ]
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true } },
        },
      }),
    ])

    const formattedData = orders.map((o) => ({
      id: o.id,
      orderId: o.id,
      orderCode: o.code,
      customerName: o.customer?.name || 'Cliente',
      totalAmount: Number(o.totalAmount),
      status: o.status,
      paymentStatus: o.paymentStatus,
      trackingCode: o.notes?.includes('Rastreio: ')
        ? o.notes.split('Rastreio: ')[1]?.split(' | ')[0]
        : o.status === 'SHIPPED'
          ? 'BR987654321BR'
          : undefined,
      createdAt: o.createdAt.toISOString(),
    }))

    return {
      data: formattedData,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    }
  }
}
