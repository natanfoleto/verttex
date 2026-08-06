import { Prisma } from '@prisma/client'
import { FastifyRequest } from 'fastify'

import { prisma } from '../../infrastructure/database/prisma'
import { AppError } from '../../shared/errors/app-error'
import { logAudit } from '../../shared/utils/audit'
import {
  CreateLotBody,
  ListLotsQuery,
  UpdateLotStatusBody,
} from './lots.schemas'

export class LotsService {
  /**
   * Helper to calculate dynamic temporal expiration condition
   */
  static calculateExpirationCondition(
    expirationDate: Date | null,
    minDeliveryDays: number = 15,
    warningDays: number = 30,
  ) {
    if (!expirationDate) {
      return {
        condition: 'valid' as const,
        daysRemaining: null,
        isExpired: false,
      }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const exp = new Date(expirationDate)
    exp.setHours(23, 59, 59, 999)

    const diffTime = exp.getTime() - today.getTime()
    const daysRemaining = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (daysRemaining < 0) {
      return {
        condition: 'expired' as const,
        daysRemaining,
        isExpired: true,
      }
    }

    if (daysRemaining < minDeliveryDays) {
      return {
        condition: 'insufficient' as const,
        daysRemaining,
        isExpired: false,
      }
    }

    if (daysRemaining <= warningDays) {
      return {
        condition: 'warning' as const,
        daysRemaining,
        isExpired: false,
      }
    }

    return {
      condition: 'valid' as const,
      daysRemaining,
      isExpired: false,
    }
  }

  /**
   * Create a new Product Lot
   */
  static async createLot(
    body: CreateLotBody,
    userId: string,
    req?: FastifyRequest,
  ) {
    // Validate manufacturing vs expiration dates
    if (body.manufacturingDate && body.expirationDate) {
      const mfg = new Date(body.manufacturingDate)
      const exp = new Date(body.expirationDate)
      if (mfg > exp) {
        throw new AppError(
          'VALIDATION_ERROR',
          'Data de fabricação não pode ser posterior à data de validade',
          400,
        )
      }
    }

    // Verify product exists and matches store
    const product = await prisma.product.findFirst({
      where: { id: body.productId, storeId: body.storeId, deletedAt: null },
    })
    if (!product) {
      throw new AppError('NOT_FOUND', 'Produto não encontrado na loja', 404)
    }

    // Check unique lot per (store, product, variation, lotNumber)
    const existing = await prisma.productLot.findFirst({
      where: {
        storeId: body.storeId,
        productId: body.productId,
        variationId: body.variationId || null,
        lotNumber: body.lotNumber.trim(),
      },
    })

    if (existing) {
      throw new AppError(
        'VALIDATION_ERROR',
        `Já existe um lote cadastrado com o código "${body.lotNumber}" para este produto nesta loja`,
        400,
      )
    }

    const lot = await prisma.productLot.create({
      data: {
        storeId: body.storeId,
        productId: body.productId,
        variationId: body.variationId || null,
        lotNumber: body.lotNumber.trim(),
        manufacturer: body.manufacturer?.trim() || null,
        supplier: body.supplier?.trim() || null,
        manufacturingDate: body.manufacturingDate
          ? new Date(body.manufacturingDate)
          : null,
        expirationDate: body.expirationDate
          ? new Date(body.expirationDate)
          : null,
        notes: body.notes?.trim() || null,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        product: { select: { id: true, name: true, slug: true } },
        variation: { select: { id: true, sku: true } },
      },
    })

    await logAudit({
      userId,
      action: 'CREATE_LOT',
      entity: 'ProductLot',
      entityId: lot.id,
      newValues: {
        lotNumber: lot.lotNumber,
        productId: lot.productId,
        expirationDate: lot.expirationDate,
      },
      req,
    })

    return lot
  }

  /**
   * List lots with pagination, status and expiration condition filters
   */
  static async listLots(query: ListLotsQuery) {
    const {
      storeId,
      productId,
      variationId,
      status,
      expirationCondition,
      search,
      page,
      limit,
    } = query
    const skip = (page - 1) * limit

    const where: Prisma.ProductLotWhereInput = {}
    if (storeId) where.storeId = storeId
    if (productId) where.productId = productId
    if (variationId) where.variationId = variationId
    if (status !== 'all') where.status = status

    if (search) {
      where.OR = [
        { lotNumber: { contains: search, mode: 'insensitive' } },
        { manufacturer: { contains: search, mode: 'insensitive' } },
        { supplier: { contains: search, mode: 'insensitive' } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [rawItems, total] = await Promise.all([
      prisma.productLot.findMany({
        where,
        include: {
          store: { select: { id: true, name: true, slug: true } },
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              warningShelfLifeDays: true,
              minDeliveryShelfLifeDays: true,
            },
          },
          variation: { select: { id: true, sku: true } },
          stockItems: {
            include: {
              location: { select: { id: true, name: true, code: true } },
            },
          },
        },
        orderBy: [{ expirationDate: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.productLot.count({ where }),
    ])

    const items = rawItems.map((lot) => {
      const minDeliveryDays = lot.product.minDeliveryShelfLifeDays || 15
      const warningDays = lot.product.warningShelfLifeDays || 30
      const expAnalysis = LotsService.calculateExpirationCondition(
        lot.expirationDate,
        minDeliveryDays,
        warningDays,
      )

      const totalPhysical = lot.stockItems.reduce(
        (acc, s) => acc + s.physicalQuantity,
        0,
      )
      const totalReserved = lot.stockItems.reduce(
        (acc, s) => acc + s.reservedQuantity,
        0,
      )

      return {
        ...lot,
        expirationAnalysis: expAnalysis,
        stockSummary: {
          physicalQuantity: totalPhysical,
          reservedQuantity: totalReserved,
          availableQuantity:
            lot.status === 'available' && !expAnalysis.isExpired
              ? Math.max(0, totalPhysical - totalReserved)
              : 0,
        },
      }
    })

    // Filter by expiration condition if provided
    const filteredItems =
      expirationCondition === 'all'
        ? items
        : items.filter(
            (item) => item.expirationAnalysis.condition === expirationCondition,
          )

    return {
      data: filteredItems,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Get Lot details
   */
  static async getLotDetails(lotId: string) {
    const lot = await prisma.productLot.findUnique({
      where: { id: lotId },
      include: {
        store: { select: { id: true, name: true, slug: true } },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            warningShelfLifeDays: true,
            minDeliveryShelfLifeDays: true,
          },
        },
        variation: { select: { id: true, sku: true } },
        stockItems: {
          include: { location: true },
        },
        stockMovements: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    })

    if (!lot) {
      throw new AppError('NOT_FOUND', 'Lote não encontrado', 404)
    }

    const expAnalysis = LotsService.calculateExpirationCondition(
      lot.expirationDate,
      lot.product.minDeliveryShelfLifeDays || 15,
      lot.product.warningShelfLifeDays || 30,
    )

    return {
      ...lot,
      expirationAnalysis: expAnalysis,
    }
  }

  /**
   * Update Operational Status of a Lot (e.g. available, quarantine, blocked, recalled)
   */
  static async updateLotStatus(
    lotId: string,
    body: UpdateLotStatusBody,
    userId: string,
    req?: FastifyRequest,
  ) {
    const lot = await prisma.productLot.findUnique({
      where: { id: lotId },
    })

    if (!lot) {
      throw new AppError('NOT_FOUND', 'Lote não encontrado', 404)
    }

    const previousStatus = lot.status
    const updatedLot = await prisma.productLot.update({
      where: { id: lotId },
      data: {
        status: body.status,
        updatedBy: userId,
      },
    })

    await logAudit({
      userId,
      action: `LOT_STATUS_CHANGE_${body.status.toUpperCase()}`,
      entity: 'ProductLot',
      entityId: lot.id,
      oldValues: { status: previousStatus },
      newValues: { status: body.status, reason: body.reason },
      req,
    })

    return updatedLot
  }

  /**
   * Generates a unique internal lot number in format INT-YYYYMMDD-XXXX
   */
  static generateInternalLotNumber(): string {
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    const random = Math.floor(1000 + Math.random() * 9000)
    return `INT-${yyyy}${mm}${dd}-${random}`
  }
}
