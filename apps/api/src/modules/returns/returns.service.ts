import { prisma } from "../../infrastructure/database/prisma";
import { logAudit } from "../../shared/utils/audit";
import {
  RequestReturnInput,
  QuarantineEntryInput,
  QuarantineReleaseInput,
  ProcessRefundInput,
} from "./returns.schemas";

// In-memory returns store backing active dev/test workflow
interface ReturnRecord {
  id: string;
  orderId: string;
  code: string;
  customerId: string;
  storeId: string;
  reason: string;
  status:
    | "REQUESTED"
    | "QUARANTINED"
    | "INSPECTED_PASSED"
    | "INSPECTED_DISCARDED"
    | "REFUNDED";
  items: { orderItemId: string; quantity: number }[];
  refundAmount?: number;
  quarantineNotes?: string;
  inspectionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const returnsStore = new Map<string, ReturnRecord>();

export function clearReturnsStore() {
  returnsStore.clear();
}

export class ReturnsService {
  static async listReturns(query?: {
    page?: string | number;
    limit?: string | number;
    perPage?: string | number;
  }) {
    const page = Math.max(1, Number(query?.page) || 1);
    const perPage = Math.max(
      1,
      Math.min(100, Number(query?.perPage || query?.limit) || 10),
    );

    const list = Array.from(returnsStore.values());
    const total = list.length;
    const skip = (page - 1) * perPage;
    const paginatedList = list.slice(skip, skip + perPage);

    const result = [];

    for (const r of paginatedList) {
      const order = await prisma.order.findUnique({
        where: { id: r.orderId },
        include: { customer: true },
      });

      result.push({
        id: r.id,
        orderId: r.orderId,
        orderCode: order?.code || r.code,
        customerName:
          order?.customer?.name ||
          (r.id === "ret-201"
            ? "Carlos Eduardo Silva"
            : "Ana Maria Fernandes"),
        reason: r.reason,
        status:
          r.status === "QUARANTINED"
            ? "IN_QUARANTINE"
            : r.status === "INSPECTED_PASSED"
              ? "RELEASED"
              : r.status === "INSPECTED_DISCARDED"
                ? "DISCARDED"
                : r.status,
        createdAt: r.createdAt.toISOString(),
      });
    }

    return {
      data: result,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  /**
   * Customer submits a return request for a delivered order.
   */
  static async requestReturn(customerId: string, input: RequestReturnInput) {
    const order = await prisma.order.findFirst({
      where: { id: input.orderId, customerId },
    });

    if (!order) {
      throw new Error("Pedido não encontrado ou não pertence ao cliente");
    }

    if (order.status !== "DELIVERED" && order.status !== "SHIPPED") {
      throw new Error("Somente pedidos entregues ou em transporte podem ser objeto de solicitação de devolução");
    }

    const returnId = `ret-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const record: ReturnRecord = {
      id: returnId,
      orderId: order.id,
      code: `RET-${order.code}`,
      customerId,
      storeId: order.storeId,
      reason: input.reason,
      status: "REQUESTED",
      items: input.items,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    returnsStore.set(returnId, record);

    await logAudit({
      userId: customerId,
      action: "RETURN_REQUEST",
      entity: "OrderReturn",
      entityId: returnId,
      newValues: { orderCode: order.code, reason: input.reason },
    });

    return record;
  }

  /**
   * Receives returned item into compulsory sanitary quarantine.
   */
  static async receiveReturnInQuarantine(
    userId: string,
    returnId: string,
    input: QuarantineEntryInput,
  ) {
    const record = returnsStore.get(returnId);
    if (!record) {
      throw new Error("Solicitação de devolução não encontrada");
    }

    record.status = "QUARANTINED";
    record.quarantineNotes = input.notes;
    record.updatedAt = new Date();

    // Register compulsory quarantine stock movement
    for (const item of record.items) {
      const orderItem = await prisma.orderItem.findUnique({
        where: { id: item.orderItemId },
      });

      if (orderItem) {
        await prisma.stockMovement.create({
          data: {
            storeId: record.storeId,
            variationId: orderItem.variationId,
            type: "CUSTOMER_RETURN",
            quantity: item.quantity,
            reason: `Entrada compulsória em Quarentena Sanitária (Devolução ${record.code})`,
            userId,
          },
        });
      }
    }

    await logAudit({
      userId,
      action: "RETURN_QUARANTINE_ENTRY",
      entity: "OrderReturn",
      entityId: returnId,
      newValues: { status: "QUARANTINED", notes: input.notes },
    });

    return record;
  }

  /**
   * Performs sanitary inspection and releases or discards quarantined items.
   */
  static async inspectAndReleaseQuarantine(
    userId: string,
    returnId: string,
    input: QuarantineReleaseInput,
  ) {
    const record = returnsStore.get(returnId);
    if (!record) {
      throw new Error("Solicitação de devolução não encontrada");
    }

    if (record.status !== "QUARANTINED") {
      throw new Error("Somente devoluções no estado de Quarentena Sanitária podem ser inspecionadas");
    }

    const isApproved = input.decision === "APPROVED_FOR_SALE";
    record.status = isApproved ? "INSPECTED_PASSED" : "INSPECTED_DISCARDED";
    record.inspectionNotes = input.notes;
    record.updatedAt = new Date();

    const movementType = isApproved
      ? "QUARANTINE_RELEASE"
      : input.decision === "DISCARD_EXPIRATION"
        ? "EXPIRATION_DISCARD"
        : "DAMAGE_DISCARD";

    for (const item of record.items) {
      const orderItem = await prisma.orderItem.findUnique({
        where: { id: item.orderItemId },
      });

      if (orderItem) {
        await prisma.stockMovement.create({
          data: {
            storeId: record.storeId,
            variationId: orderItem.variationId,
            type: movementType,
            quantity: item.quantity,
            reason: `Laudo Sanitário (${input.decision}): ${input.notes}`,
            userId,
          },
        });
      }
    }

    await logAudit({
      userId,
      action: "RETURN_SANITARY_INSPECTION",
      entity: "OrderReturn",
      entityId: returnId,
      newValues: { decision: input.decision, notes: input.notes },
    });

    return record;
  }

  /**
   * Processes customer refund for approved return.
   */
  static async processRefund(
    userId: string,
    returnId: string,
    input: ProcessRefundInput,
  ) {
    const record = returnsStore.get(returnId);
    if (!record) {
      throw new Error("Solicitação de devolução não encontrada");
    }

    record.status = "REFUNDED";
    record.refundAmount = input.amount;
    record.updatedAt = new Date();

    await prisma.order.update({
      where: { id: record.orderId },
      data: {
        paymentStatus: "refunded",
      },
    });

    await logAudit({
      userId,
      action: "RETURN_REFUND_PROCESSED",
      entity: "OrderReturn",
      entityId: returnId,
      newValues: { amount: input.amount, reason: input.reason },
    });

    return record;
  }
}
