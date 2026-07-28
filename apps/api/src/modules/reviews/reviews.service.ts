import { prisma } from "../../infrastructure/database/prisma";
import { logAudit } from "../../shared/utils/audit";
import {
  CreateReviewInput,
  CreateQuestionInput,
  AnswerQuestionInput,
  ModerateReviewInput,
} from "./reviews.schemas";

interface ReviewRecord {
  id: string;
  productId: string;
  customerId: string;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  isHidden: boolean;
  moderationReason?: string;
  createdAt: Date;
}

interface QuestionRecord {
  id: string;
  productId: string;
  customerId: string;
  question: string;
  answer?: string;
  answeredBy?: string;
  answeredAt?: Date;
  createdAt: Date;
}

const reviewsStore = new Map<string, ReviewRecord>();
const questionsStore = new Map<string, QuestionRecord>();

export class ReviewsService {
  /**
   * Submits a product review if the customer has a verified delivered purchase.
   */
  static async createReview(customerId: string, input: CreateReviewInput) {
    // Verify that the customer has at least one DELIVERED order containing this product
    const verifiedOrder = await prisma.order.findFirst({
      where: {
        customerId,
        status: "DELIVERED",
        items: {
          some: {
            productId: input.productId,
          },
        },
      },
    });

    if (!verifiedOrder) {
      throw new Error(
        "Avaliação permitida apenas para compras verificadas. Você precisa ter um pedido entregue para avaliar este produto",
      );
    }

    const reviewId = `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const review: ReviewRecord = {
      id: reviewId,
      productId: input.productId,
      customerId,
      rating: input.rating,
      comment: input.comment,
      isVerifiedPurchase: true,
      isHidden: false,
      createdAt: new Date(),
    };

    reviewsStore.set(reviewId, review);

    await logAudit({
      userId: customerId,
      action: "REVIEW_CREATE",
      entity: "ProductReview",
      entityId: reviewId,
      newValues: {
        productId: input.productId,
        rating: input.rating,
        isVerifiedPurchase: true,
      },
    });

    return review;
  }

  /**
   * Lists public reviews and calculates average rating for a product.
   */
  static async listProductReviews(productId: string) {
    const productReviews = Array.from(reviewsStore.values()).filter(
      (r) => r.productId === productId && !r.isHidden,
    );

    const total = productReviews.length;
    const sum = productReviews.reduce((acc, r) => acc + r.rating, 0);
    const averageRating = total > 0 ? Number((sum / total).toFixed(1)) : 0;

    return {
      productId,
      totalReviews: total,
      averageRating,
      reviews: productReviews,
    };
  }

  /**
   * Submits a question about a product.
   */
  static async createQuestion(customerId: string, input: CreateQuestionInput) {
    const questionId = `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const questionRecord: QuestionRecord = {
      id: questionId,
      productId: input.productId,
      customerId,
      question: input.question,
      createdAt: new Date(),
    };

    questionsStore.set(questionId, questionRecord);

    await logAudit({
      userId: customerId,
      action: "QUESTION_CREATE",
      entity: "ProductQuestion",
      entityId: questionId,
      newValues: { productId: input.productId, question: input.question },
    });

    return questionRecord;
  }

  /**
   * Merchant/Seller answers a product question.
   */
  static async answerQuestion(
    userId: string,
    questionId: string,
    input: AnswerQuestionInput,
  ) {
    const question = questionsStore.get(questionId);
    if (!question) {
      throw new Error("Pergunta não encontrada");
    }

    question.answer = input.answer;
    question.answeredBy = userId;
    question.answeredAt = new Date();

    await logAudit({
      userId,
      action: "QUESTION_ANSWER",
      entity: "ProductQuestion",
      entityId: questionId,
      newValues: { answer: input.answer },
    });

    return question;
  }

  /**
   * Moderates a review by hiding or showing it.
   */
  static async moderateReview(
    userId: string,
    reviewId: string,
    input: ModerateReviewInput,
  ) {
    const review = reviewsStore.get(reviewId);
    if (!review) {
      throw new Error("Avaliação não encontrada");
    }

    review.isHidden = input.isHidden;
    review.moderationReason = input.reason;

    await logAudit({
      userId,
      action: "REVIEW_MODERATE",
      entity: "ProductReview",
      entityId: reviewId,
      newValues: { isHidden: input.isHidden, reason: input.reason },
    });

    return review;
  }
}
