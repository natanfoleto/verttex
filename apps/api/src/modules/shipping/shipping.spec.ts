import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "../../infrastructure/database/prisma";
import { ShippingService } from "./shipping.service";
import { quoteShippingSchema } from "./shipping.schemas";

vi.mock("../../infrastructure/database/prisma", () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    stockReservation: {
      update: vi.fn(),
    },
    stockMovement: {
      create: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(prisma)),
  },
}));

vi.mock("../../shared/utils/audit", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

describe("ShippingService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("quoteShipping", () => {
    it("should calculate shipping options and delivery estimates for valid zipCode", async () => {
      const parsedInput = quoteShippingSchema.parse({
        zipCode: "01001-000",
        items: [{ variationId: "var-1", quantity: 2 }],
      });

      const result = await ShippingService.quoteShipping(parsedInput);

      expect(result.zipCode).toBe("01001000");
      expect(result.options.length).toBe(2);
      expect(result.options[0]?.carrier).toBe("VERTTEX Express");
      expect(result.options[1]?.carrier).toBe("VERTTEX Logística Climatizada");
    });
  });

  describe("dispatchOrder", () => {
    it("should dispatch order, update status to SHIPPED and create DISPATCH stock movement", async () => {
      const futureExpiration = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days in future

      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: "order-10",
        code: "VTX-DISPATCH-1",
        status: "PAID",
        stockReservations: [
          {
            id: "res-1",
            storeId: "store-1",
            variationId: "var-1",
            locationId: "loc-1",
            lotId: "lot-valid",
            reservedQuantity: 4,
            status: "ACTIVE",
            lot: {
              id: "lot-valid",
              lotNumber: "LOT-2026-SAFE",
              expirationDate: futureExpiration,
            },
          },
        ],
        items: [],
      } as any);

      vi.mocked(prisma.order.update).mockResolvedValue({
        id: "order-10",
        code: "VTX-DISPATCH-1",
        status: "SHIPPED",
      } as any);

      const result = await ShippingService.dispatchOrder("user-1", "order-10", {
        trackingCode: "TRK123456BR",
        carrierName: "Loggi Climatizada",
      });

      expect(result.status).toBe("SHIPPED");
      expect(prisma.stockReservation.update).toHaveBeenCalledWith({
        where: { id: "res-1" },
        data: { status: "FULFILLED" },
      });

      expect(prisma.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: "DISPATCH",
            quantity: 4,
            sourceLocationId: "loc-1",
          }),
        }),
      );
    });

    it("should block dispatch when lot expiration date is inferior to required delivery shelf life margin", async () => {
      const expiredSoonDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // Only 5 days valid (below required 18 days)

      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: "order-11",
        code: "VTX-DISPATCH-FAIL",
        status: "PAID",
        stockReservations: [
          {
            id: "res-2",
            storeId: "store-1",
            variationId: "var-1",
            locationId: "loc-1",
            lotId: "lot-expiring",
            reservedQuantity: 2,
            status: "ACTIVE",
            lot: {
              id: "lot-expiring",
              lotNumber: "LOT-EXPIRED-SOON",
              expirationDate: expiredSoonDate,
            },
          },
        ],
        items: [],
      } as any);

      await expect(
        ShippingService.dispatchOrder("user-1", "order-11", {
          trackingCode: "TRK999999BR",
          carrierName: "Express",
        }),
      ).rejects.toThrow("Despacho bloqueado");
    });
  });

  describe("markAsDelivered", () => {
    it("should mark order as DELIVERED when current status is SHIPPED", async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: "order-12",
        code: "VTX-DELIVERED-1",
        status: "SHIPPED",
      } as any);

      vi.mocked(prisma.order.update).mockResolvedValue({
        id: "order-12",
        status: "DELIVERED",
      } as any);

      const result = await ShippingService.markAsDelivered("user-1", "order-12");

      expect(result.status).toBe("DELIVERED");
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: "order-12" },
        data: { status: "DELIVERED" },
      });
    });
  });
});
