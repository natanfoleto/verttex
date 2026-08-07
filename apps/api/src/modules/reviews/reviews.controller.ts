import { FastifyReply, FastifyRequest } from 'fastify'

import { AppError } from '../../shared/errors/app-error'
import {
  answerQuestionSchema,
  createQuestionSchema,
  createReviewSchema,
  moderateReviewSchema,
} from './reviews.schemas'
import { ReviewsService } from './reviews.service'

function getActor(req: FastifyRequest) {
  const actor = req.userPayload
  if (!actor) {
    throw new AppError('UNAUTHORIZED', 'Usuário não autenticado', 401)
  }
  return actor
}

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
  const actor = getActor(req)
  const { questionId } = req.params as { questionId: string }
  const body = answerQuestionSchema.parse(req.body)

  const result = await ReviewsService.answerQuestion(actor, questionId, body)
  return reply.status(200).send({
    success: true,
    data: result,
  })
}

export async function moderateReviewController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const actor = getActor(req)
  const { reviewId } = req.params as { reviewId: string }
  const body = moderateReviewSchema.parse(req.body)

  const result = await ReviewsService.moderateReview(actor, reviewId, body)
  return reply.status(200).send({
    success: true,
    data: result,
  })
}
