import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "../../infrastructure/database/prisma";
import { ReviewsService } from "./reviews.service";

vi.mock("../../infrastructure/database/prisma", () => ({
  prisma: {
    order: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("../../shared/utils/audit", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

describe("ReviewsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createReview (Verified Purchase)", () => {
    it("should allow review creation when customer has a DELIVERED order for the product", async () => {
      vi.mocked(prisma.order.findFirst).mockResolvedValue({
        id: "order-verified-1",
        customerId: "cust-1",
        status: "DELIVERED",
      } as any);

      const result = await ReviewsService.createReview("cust-1", {
        productId: "prod-cheese-1",
        rating: 5,
        comment: "Excelente queijo canastra, sabor autêntico e maturação perfeita!",
      });

      expect(result.id).toBeDefined();
      expect(result.rating).toBe(5);
      expect(result.isVerifiedPurchase).toBe(true);
    });

    it("should reject review creation when customer has no DELIVERED order for the product", async () => {
      vi.mocked(prisma.order.findFirst).mockResolvedValue(null);

      await expect(
        ReviewsService.createReview("cust-1", {
          productId: "prod-unbought",
          rating: 1,
          comment: "Nunca comprei mas não gostei",
        }),
      ).rejects.toThrow("Avaliação permitida apenas para compras verificadas");
    });
  });

  describe("createQuestion & answerQuestion", () => {
    it("should submit a question and allow merchant to answer", async () => {
      const q = await ReviewsService.createQuestion("cust-2", {
        productId: "prod-cheese-1",
        question: "Este queijo precisa ficar refrigerado durante o transporte?",
      });

      expect(q.id).toBeDefined();
      expect(q.question).toBe("Este queijo precisa ficar refrigerado durante o transporte?");

      const answered = await ReviewsService.answerQuestion("user-merchant", q.id, {
        answer: "Sim! Enviamos em embalagem térmica climatizada com controle sanitário de temperatura.",
      });

      expect(answered.answer).toContain("embalagem térmica");
      expect(answered.answeredBy).toBe("user-merchant");
    });
  });

  describe("moderateReview", () => {
    it("should allow manager to hide an inappropriate review", async () => {
      vi.mocked(prisma.order.findFirst).mockResolvedValue({
        id: "order-verified-2",
        status: "DELIVERED",
      } as any);

      const review = await ReviewsService.createReview("cust-1", {
        productId: "prod-cheese-2",
        rating: 1,
        comment: "Comentário com spam link http://spam.com",
      });

      const moderated = await ReviewsService.moderateReview("user-manager", review.id, {
        isHidden: true,
        reason: "Spam link detectado",
      });

      expect(moderated.isHidden).toBe(true);

      const listing = await ReviewsService.listProductReviews("prod-cheese-2");
      expect(listing.reviews.find((r) => r.id === review.id)).toBeUndefined();
    });
  });
});
