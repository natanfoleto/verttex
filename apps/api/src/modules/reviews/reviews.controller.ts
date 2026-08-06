import { FastifyReply, FastifyRequest } from 'fastify'

import {
  answerQuestionSchema,
  createQuestionSchema,
  createReviewSchema,
  moderateReviewSchema,
} from './reviews.schemas'
import { ReviewsService } from './reviews.service'

export async function createReviewController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const customerId = req.customer?.id || req.customerPayload?.id || ''
  const body = createReviewSchema.parse(req.body)

  const result = await ReviewsService.createReview(customerId, body)
  return reply.status(201).send({
    success: true,
    data: result,
  })
}

export async function listProductReviewsController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const { productId } = req.params as { productId: string }
  const result = await ReviewsService.listProductReviews(productId)
  return reply.status(200).send({
    success: true,
    data: result,
  })
}

export async function createQuestionController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const customerId = req.customer?.id || req.customerPayload?.id || ''
  const body = createQuestionSchema.parse(req.body)

  const result = await ReviewsService.createQuestion(customerId, body)
  return reply.status(201).send({
    success: true,
    data: result,
  })
}

export async function answerQuestionController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = req.userPayload?.id || 'system'
  const { questionId } = req.params as { questionId: string }
  const body = answerQuestionSchema.parse(req.body)

  const result = await ReviewsService.answerQuestion(userId, questionId, body)
  return reply.status(200).send({
    success: true,
    data: result,
  })
}

export async function moderateReviewController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = req.userPayload?.id || 'system'
  const { reviewId } = req.params as { reviewId: string }
  const body = moderateReviewSchema.parse(req.body)

  const result = await ReviewsService.moderateReview(userId, reviewId, body)
  return reply.status(200).send({
    success: true,
    data: result,
  })
}
