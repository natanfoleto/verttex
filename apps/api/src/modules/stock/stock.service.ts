import { FastifyRequest } from "fastify";
import { AppError } from "../../shared/errors/app-error";
import { prisma } from "../../infrastructure/database/prisma";
import { logAudit } from "../../shared/utils/audit";
import { LotsService } from "../lots/lots.service";
import {
  AdjustStockBody,
  DiscardExpiredStockBody,
  ListStockMovementsQuery,
  QueryAvailabilityQuery,
  ReceiveStockBody,
  TransferStockBody,
} from "./stock.schemas";

export function resolveStockMode(
  product: {
    stockMode?: string | null;
    hasBatchControl?: boolean;
    hasExpirationControl?: boolean;
    isExpirationRequired?: boolean;
  },
  variation?: {
    stockMode?: string | null;
    hasBatchControl?: boolean | null;
    hasExpirationControl?: boolean | null;
    isExpirationRequired?: boolean | null;
  },
): "NOT_TRACKED" | "SIMPLE" | "BATCH" | "BATCH_WITH_EXPIRATION" {
  if (variation?.stockMode) return variation.stockMode as any;
  if (product.stockMode) return product.stockMode as any;

  const hasExp = variation?.hasExpirationControl ?? product.hasExpirationControl;
  const isExpReq = variation?.isExpirationRequired ?? product.isExpirationRequired;
  const hasBatch = variation?.hasBatchControl ?? product.hasBatchControl;

  if (hasExp && isExpReq) return "BATCH_WITH_EXPIRATION";
  if (hasBatch || hasExp) return "BATCH";
  return "SIMPLE";
}

export class StockService {
  static resolveStockMode(
    product: {
      stockMode?: string | null;
      hasBatchControl?: boolean;
      hasExpirationControl?: boolean;
      isExpirationRequired?: boolean;
    },
    variation?: {
      stockMode?: string | null;
      hasBatchControl?: boolean | null;
      hasExpirationControl?: boolean | null;
      isExpirationRequired?: boolean | null;
    },
  ) {
    return resolveStockMode(product, variation);
  }
  /**
   * Receive stock batch into inventory (supports multiple lots)
   */
  static async receiveStock(
    body: ReceiveStockBody,
    userId: string,
    req?: FastifyRequest,
  ) {
    const variation = await prisma.productVariation.findFirst({
      where: { id: body.variationId, deletedAt: null },
      include: {
        product: true,
      },
    });

    if (!variation || variation.product.storeId !== body.storeId) {
      throw new AppError(
        "NOT_FOUND",
        "Variação do produto não encontrada nesta loja",
        404,
      );
    }

    const product = variation.product;
    const effectiveStockMode = resolveStockMode(product, variation);

    if (effectiveStockMode === "NOT_TRACKED") {
      return {
        success: true,
        message: "Produto configurado como NOT_TRACKED. Saldo de estoque não é gerenciado.",
        items: [],
      };
    }

    // Get or create default inventory location
    let locationId = body.locationId;
    if (!locationId) {
      const defaultLoc = await prisma.inventoryLocation.upsert({
        where: {
          storeId_code: {
            storeId: body.storeId,
            code: "DEP-01",
          },
        },
        update: {},
        create: {
          storeId: body.storeId,
          name: body.locationName || "Depósito Principal",
          code: "DEP-01",
          isDefault: true,
          status: "active",
        },
      });
      locationId = defaultLoc.id;
    }

    const minReceivingDays = product.minReceivingShelfLifeDays || 0;

    const results = await prisma.$transaction(async (tx) => {
      const createdLotRecords: any[] = [];

      for (const item of body.lots) {
        // Mode-based lot & expiration requirements
        let finalLotNumber = item.lotNumber?.trim();

        if (effectiveStockMode === "BATCH" || effectiveStockMode === "BATCH_WITH_EXPIRATION") {
          if (!finalLotNumber) {
            // Auto-generate internal lot code
            finalLotNumber = LotsService.generateInternalLotNumber();
          }
          if (effectiveStockMode === "BATCH_WITH_EXPIRATION" && !item.expirationDate) {
            throw new AppError(
              "VALIDATION_ERROR",
              `Data de validade é obrigatória para produtos no modo BATCH_WITH_EXPIRATION (lote: ${finalLotNumber})`,
              400,
            );
          }
        }

        // Validate receiving shelf life policy if expiration control is required
        if (item.expirationDate && minReceivingDays > 0) {
          const expAnalysis = LotsService.calculateExpirationCondition(
            new Date(item.expirationDate),
            minReceivingDays,
            30,
          );
          if (
            expAnalysis.isExpired ||
            (expAnalysis.daysRemaining !== null &&
              expAnalysis.daysRemaining < minReceivingDays)
          ) {
            throw new AppError(
              "VALIDATION_ERROR",
              `Lote "${finalLotNumber}" rejeitado no recebimento: validade restante (${expAnalysis.daysRemaining || 0} dias) está abaixo do mínimo exigido no recebimento (${minReceivingDays} dias)`,
              400,
            );
          }
        }

        const lotSearchNumber = finalLotNumber || "PADRAO";

        // Find or create lot
        let lot = await tx.productLot.findFirst({
          where: {
            storeId: body.storeId,
            productId: product.id,
            variationId: variation.id,
            lotNumber: lotSearchNumber,
          },
        });

        if (!lot) {
          lot = await tx.productLot.create({
            data: {
              storeId: body.storeId,
              productId: product.id,
              variationId: variation.id,
              lotNumber: lotSearchNumber,
              manufacturer: item.manufacturer?.trim() || null,
              supplier: item.supplier?.trim() || null,
              manufacturingDate: item.manufacturingDate
                ? new Date(item.manufacturingDate)
                : null,
              expirationDate: item.expirationDate
                ? new Date(item.expirationDate)
                : null,
              notes: item.notes?.trim() || null,
              createdBy: userId,
              updatedBy: userId,
            },
          });
        }

        // Update or create StockItem
        const stockItem = await tx.stockItem.upsert({
          where: {
            storeId_variationId_lotId_locationId: {
              storeId: body.storeId,
              variationId: variation.id,
              lotId: lot.id,
              locationId,
            },
          },
          update: {
            physicalQuantity: { increment: item.quantity },
          },
          create: {
            storeId: body.storeId,
            variationId: variation.id,
            lotId: lot.id,
            locationId,
            physicalQuantity: item.quantity,
            reservedQuantity: 0,
          },
        });

        // Record audit movement
        await tx.stockMovement.create({
          data: {
            storeId: body.storeId,
            variationId: variation.id,
            lotId: lot.id,
            targetLocationId: locationId,
            type: "RECEIVING",
            quantity: item.quantity,
            reason: body.documentReference
              ? `Recebimento NFe/Doc: ${body.documentReference}`
              : "Recebimento de mercadoria",
            referenceId: body.documentReference || null,
            userId,
          },
        });

        createdLotRecords.push({
          lotId: lot.id,
          lotNumber: lot.lotNumber,
          expirationDate: lot.expirationDate,
          quantity: item.quantity,
          stockItemId: stockItem.id,
        });
      }

      return createdLotRecords;
    });

    await logAudit({
      userId,
      action: "RECEIVE_STOCK",
      entity: "StockItem",
      entityId: variation.id,
      newValues: {
        storeId: body.storeId,
        variationId: variation.id,
        receivedLotsCount: body.lots.length,
        totalQuantity: body.lots.reduce((acc, l) => acc + l.quantity, 0),
      },
      req,
    });

    return {
      success: true,
      message: "Estoque recebido e registrado com sucesso!",
      items: results,
    };
  }

  /**
   * Query commercial availability using FEFO (First Expired, First Out)
   */
  static async queryCommercialAvailability(
    query: QueryAvailabilityQuery,
  ): Promise<any> {
    const { storeId, variationId, estimatedDeliveryDate, requestedQuantity } =
      query;

    if (!variationId) {
      if (!storeId) {
        throw new AppError(
          "VALIDATION_ERROR",
          "storeId ou variationId é obrigatório",
          400,
        );
      }

      const items = await prisma.stockItem.findMany({
        where: { storeId },
        include: {
          variation: {
            include: {
              product: { select: { id: true, name: true } },
            },
          },
        },
      });

      const groupedMap = new Map<string, any>();

      for (const item of items) {
        const key = item.variationId;
        const current = groupedMap.get(key) || {
          variationId: key,
          sku: item.variation?.sku || "SKU-N/A",
          productName: item.variation?.product?.name || "Produto sem nome",
          physicalQuantity: 0,
          reservedQuantity: 0,
          availableQuantity: 0,
          status: "available",
        };

        current.physicalQuantity += item.physicalQuantity;
        current.reservedQuantity += item.reservedQuantity;
        current.availableQuantity = Math.max(
          0,
          current.physicalQuantity - current.reservedQuantity,
        );
        groupedMap.set(key, current);
      }

      return Array.from(groupedMap.values());
    }

    const variation = await prisma.productVariation.findFirst({
      where: { id: variationId, deletedAt: null },
      include: { product: true },
    });

    if (!variation || (storeId && variation.product.storeId !== storeId)) {
      throw new AppError(
        "NOT_FOUND",
        "Variação do produto não encontrada",
        404,
      );
    }

    const product = variation.product;
    const minDeliveryDays = product.minDeliveryShelfLifeDays || 15;

    const stockItems = await prisma.stockItem.findMany({
      where: {
        storeId,
        variationId,
        location: { status: "active" },
      },
      include: {
        lot: true,
        location: { select: { id: true, name: true, code: true } },
      },
    });

    const deliveryTargetDate = estimatedDeliveryDate
      ? new Date(estimatedDeliveryDate)
      : new Date();

    // FEFO Filtering & Sorting
    const eligibleAllocations: any[] = [];
    let totalCommercialAvailable = 0;

    for (const item of stockItems) {
      const netAvailable = Math.max(
        0,
        item.physicalQuantity - item.reservedQuantity,
      );
      if (netAvailable <= 0) continue;

      let isEligible = true;
      let expAnalysis: any = null;

      if (item.lot) {
        // Operational status check (must be 'available')
        if (item.lot.status !== "available") {
          isEligible = false;
        }

        // Expiration check
        expAnalysis = LotsService.calculateExpirationCondition(
          item.lot.expirationDate,
          minDeliveryDays,
          product.warningShelfLifeDays || 30,
        );

        if (expAnalysis.isExpired) {
          isEligible = false;
        } else if (item.lot.expirationDate) {
          const expTime = new Date(item.lot.expirationDate).getTime();
          const targetTimeWithMargin =
            deliveryTargetDate.getTime() +
            minDeliveryDays * 24 * 60 * 60 * 1000;
          if (expTime < targetTimeWithMargin) {
            isEligible = false; // Insufficient shelf life for delivery
          }
        }
      }

      if (isEligible) {
        totalCommercialAvailable += netAvailable;
        eligibleAllocations.push({
          stockItemId: item.id,
          location: item.location,
          lotId: item.lotId,
          lotNumber: item.lot?.lotNumber || "Sem Lote",
          expirationDate: item.lot?.expirationDate || null,
          daysRemaining: expAnalysis?.daysRemaining ?? null,
          availableQuantity: netAvailable,
          receivedAt: item.lot?.receivedAt || item.createdAt,
        });
      }
    }

    // Sort by FEFO: 1) Earliest expiration ASC, 2) Earliest receivedAt ASC
    eligibleAllocations.sort((a, b) => {
      if (a.expirationDate && b.expirationDate) {
        return (
          new Date(a.expirationDate).getTime() -
          new Date(b.expirationDate).getTime()
        );
      }
      if (a.expirationDate) return -1;
      if (b.expirationDate) return 1;
      return (
        new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()
      );
    });

    // Fulfill requested quantity across FEFO allocations
    let remainingToAllocate = requestedQuantity;
    const fefoReservations: any[] = [];

    for (const alloc of eligibleAllocations) {
      if (remainingToAllocate <= 0) break;
      const takeQty = Math.min(alloc.availableQuantity, remainingToAllocate);
      fefoReservations.push({
        ...alloc,
        allocatedQuantity: takeQty,
      });
      remainingToAllocate -= takeQty;
    }

    return {
      storeId,
      variationId,
      productName: product.name,
      sku: variation.sku,
      totalCommercialAvailable,
      isFulfillable: remainingToAllocate === 0,
      requestedQuantity,
      allocatedQuantity: requestedQuantity - Math.max(0, remainingToAllocate),
      fefoAllocations: fefoReservations,
    };
  }

  /**
   * Manual Inventory Adjustment
   */
  static async adjustStock(
    body: AdjustStockBody,
    userId: string,
    req?: FastifyRequest,
  ) {
    const stockItem = await prisma.stockItem.findFirst({
      where: {
        storeId: body.storeId,
        variationId: body.variationId,
        lotId: body.lotId || null,
        locationId: body.locationId,
      },
    });

    const previousQty = stockItem?.physicalQuantity || 0;
    const diff = body.newPhysicalQuantity - previousQty;

    let updatedItem;
    if (stockItem) {
      updatedItem = await prisma.stockItem.update({
        where: { id: stockItem.id },
        data: { physicalQuantity: body.newPhysicalQuantity },
      });
    } else {
      updatedItem = await prisma.stockItem.create({
        data: {
          storeId: body.storeId,
          variationId: body.variationId,
          lotId: body.lotId || null,
          locationId: body.locationId,
          physicalQuantity: body.newPhysicalQuantity,
          reservedQuantity: 0,
        },
      });
    }

    await prisma.stockMovement.create({
      data: {
        storeId: body.storeId,
        variationId: body.variationId,
        lotId: body.lotId || null,
        targetLocationId: body.locationId,
        type: "INVENTORY_ADJUSTMENT",
        quantity: diff,
        reason: `Ajuste manual de inventário: ${body.reason}`,
        userId,
      },
    });

    await logAudit({
      userId,
      action: "ADJUST_STOCK",
      entity: "StockItem",
      entityId: updatedItem.id,
      oldValues: { physicalQuantity: previousQty },
      newValues: {
        physicalQuantity: body.newPhysicalQuantity,
        diff,
        reason: body.reason,
      },
      req,
    });

    return updatedItem;
  }

  /**
   * Formal Expiration or Damage Discard
   */
  static async discardExpiredStock(
    body: DiscardExpiredStockBody,
    userId: string,
    req?: FastifyRequest,
  ) {
    const stockItem = await prisma.stockItem.findFirst({
      where: {
        storeId: body.storeId,
        lotId: body.lotId,
        locationId: body.locationId,
      },
    });

    if (!stockItem || stockItem.physicalQuantity < body.quantity) {
      throw new AppError(
        "VALIDATION_ERROR",
        `Saldo insuficiente no lote para descarte (${stockItem?.physicalQuantity || 0} disponível)`,
        400,
      );
    }

    const updatedItem = await prisma.stockItem.update({
      where: { id: stockItem.id },
      data: {
        physicalQuantity: { decrement: body.quantity },
      },
    });

    const type =
      body.reason === "expired" ? "EXPIRATION_DISCARD" : "DAMAGE_DISCARD";

    await prisma.stockMovement.create({
      data: {
        storeId: body.storeId,
        variationId: stockItem.variationId,
        lotId: body.lotId,
        sourceLocationId: body.locationId,
        type,
        quantity: -body.quantity,
        reason: `Descarte formal: ${body.reason}. Destino: ${body.destination}. Obs: ${body.notes || "N/A"}`,
        userId,
      },
    });

    await logAudit({
      userId,
      action: `STOCK_DISCARD_${body.reason.toUpperCase()}`,
      entity: "StockItem",
      entityId: stockItem.id,
      newValues: {
        lotId: body.lotId,
        discardedQuantity: body.quantity,
        destination: body.destination,
      },
      req,
    });

    return updatedItem;
  }

  /**
   * Transfer Stock Between Locations
   */
  static async transferStock(
    body: TransferStockBody,
    userId: string,
    req?: FastifyRequest,
  ) {
    const sourceItem = await prisma.stockItem.findFirst({
      where: {
        storeId: body.storeId,
        variationId: body.variationId,
        lotId: body.lotId || null,
        locationId: body.sourceLocationId,
      },
    });

    if (!sourceItem || sourceItem.physicalQuantity < body.quantity) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Saldo insuficiente na localização de origem para a transferência",
        400,
      );
    }

    const targetItem = await prisma.stockItem.findFirst({
      where: {
        storeId: body.storeId,
        variationId: body.variationId,
        lotId: body.lotId || null,
        locationId: body.targetLocationId,
      },
    });

    await prisma.$transaction(async (tx) => {
      await tx.stockItem.update({
        where: { id: sourceItem.id },
        data: { physicalQuantity: { decrement: body.quantity } },
      });

      if (targetItem) {
        await tx.stockItem.update({
          where: { id: targetItem.id },
          data: { physicalQuantity: { increment: body.quantity } },
        });
      } else {
        await tx.stockItem.create({
          data: {
            storeId: body.storeId,
            variationId: body.variationId,
            lotId: body.lotId || null,
            locationId: body.targetLocationId,
            physicalQuantity: body.quantity,
            reservedQuantity: 0,
          },
        });
      }

      await tx.stockMovement.create({
        data: {
          storeId: body.storeId,
          variationId: body.variationId,
          lotId: body.lotId || null,
          sourceLocationId: body.sourceLocationId,
          targetLocationId: body.targetLocationId,
          type: "TRANSFER",
          quantity: body.quantity,
          reason: body.reason || "Transferência interna de localização",
          userId,
        },
      });
    });

    await logAudit({
      userId,
      action: "TRANSFER_STOCK",
      entity: "StockItem",
      entityId: sourceItem.id,
      newValues: {
        sourceLocationId: body.sourceLocationId,
        targetLocationId: body.targetLocationId,
        quantity: body.quantity,
      },
      req,
    });

    return { success: true, message: "Transferência realizada com sucesso!" };
  }

  /**
   * List Stock Movements History
   */
  static async listStockMovements(query: ListStockMovementsQuery) {
    const page = Math.max(1, query.page || 1);
    const perPage = Math.max(1, Math.min(100, query.perPage || 20));
    const skip = (page - 1) * perPage;

    const where: any = {};
    if (query.storeId) where.storeId = query.storeId;
    if (query.variationId) where.variationId = query.variationId;

    if (query.search) {
      const search = query.search.trim();
      where.OR = [
        { type: { contains: search, mode: "insensitive" } },
        { reason: { contains: search, mode: "insensitive" } },
        { variation: { sku: { contains: search, mode: "insensitive" } } },
        {
          variation: {
            product: { name: { contains: search, mode: "insensitive" } },
          },
        },
      ];
    }

    const [total, movements] = await Promise.all([
      prisma.stockMovement.count({ where }),
      prisma.stockMovement.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: "desc" },
        include: {
          variation: {
            select: {
              sku: true,
              product: { select: { name: true } },
            },
          },
          user: {
            select: { name: true, email: true },
          },
        },
      }),
    ]);

    return {
      data: movements,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }
}
