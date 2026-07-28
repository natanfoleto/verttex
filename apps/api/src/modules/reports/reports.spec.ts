import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "../../infrastructure/database/prisma";
import { ReportsService } from "./reports.service";

vi.mock("../../infrastructure/database/prisma", () => ({
  prisma: {
    order: {
      findMany: vi.fn(),
    },
    orderItem: {
      findMany: vi.fn(),
    },
    stockMovement: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("../../shared/utils/audit", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

describe("ReportsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSalesSummary", () => {
    it("should calculate total revenue, order count, and average ticket size", async () => {
      vi.mocked(prisma.order.findMany).mockResolvedValue([
        { totalAmount: 100.0 },
        { totalAmount: 200.0 },
        { totalAmount: 300.0 },
      ] as any);

      const summary = await ReportsService.getSalesSummary({ storeId: "store-1" });

      expect(summary.orderCount).toBe(3);
      expect(summary.totalRevenue).toBe(600.0);
      expect(summary.averageTicket).toBe(200.0);
    });
  });

  describe("getTopProductsAndAbc", () => {
    it("should aggregate products and classify ABC curve correctly", async () => {
      vi.mocked(prisma.orderItem.findMany).mockResolvedValue([
        {
          productId: "p1",
          productName: "Queijo Canastra Premium",
          sku: "QUEIJO-A",
          quantity: 10,
          subtotal: 800.0,
        },
        {
          productId: "p2",
          productName: "Doce de Leite Viçosa",
          sku: "DOCE-B",
          quantity: 5,
          subtotal: 150.0,
        },
        {
          productId: "p3",
          productName: "Goiabada Cascão",
          sku: "GOIABA-C",
          quantity: 2,
          subtotal: 50.0,
        },
      ] as any);

      const abc = await ReportsService.getTopProductsAndAbc({ storeId: "store-1" });

      expect(abc.totalProducts).toBe(3);
      expect(abc.grandTotalRevenue).toBe(1000.0);
      expect(abc.products[0]?.productId).toBe("p1");
      expect(abc.products[0]?.category).toBe("A"); // 800 / 1000 = 80%
      expect(abc.products[1]?.category).toBe("B"); // 950 / 1000 = 95%
      expect(abc.products[2]?.category).toBe("C");
    });
  });

  describe("getInventoryLossesReport", () => {
    it("should aggregate inventory losses by damage vs expiration discard", async () => {
      vi.mocked(prisma.stockMovement.findMany).mockResolvedValue([
        { type: "DAMAGE_DISCARD", quantity: 3 },
        { type: "EXPIRATION_DISCARD", quantity: 7 },
        { type: "EXPIRATION_DISCARD", quantity: 2 },
      ] as any);

      const losses = await ReportsService.getInventoryLossesReport({ storeId: "store-1" });

      expect(losses.totalDiscardedQuantity).toBe(12);
      expect(losses.byReason.damageDiscard).toBe(3);
      expect(losses.byReason.expirationDiscard).toBe(9);
    });
  });

  describe("exportReport", () => {
    it("should generate CSV export and log audit entry", async () => {
      vi.mocked(prisma.order.findMany).mockResolvedValue([
        { totalAmount: 500.0 },
      ] as any);

      vi.mocked(prisma.stockMovement.findMany).mockResolvedValue([
        { type: "EXPIRATION_DISCARD", quantity: 4 },
      ] as any);

      const result = await ReportsService.exportReport("user-admin", {
        format: "csv",
        storeId: "store-1",
      });

      expect(result.format).toBe("csv");
      expect(result.contentType).toBe("text/csv");
      expect(result.content).toContain("Métrica,Valor");
      expect(result.content).toContain("500");
    });
  });
});
