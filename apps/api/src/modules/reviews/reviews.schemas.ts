import { z } from 'zod'

export const createReviewSchema = z.object({
  productId: z.string().min(1, 'ID do produto é obrigatório'),
  rating: z.number().int().min(1, 'Nota mínima é 1').max(5, 'Nota máxima é 5'),
  comment: z.string().min(3, 'Comentário deve ter no mínimo 3 caracteres'),
})

export const createQuestionSchema = z.object({
  productId: z.string().min(1, 'ID do produto é obrigatório'),
  question: z.string().min(5, 'Pergunta deve ter no mínimo 5 caracteres'),
})

export const answerQuestionSchema = z.object({
  answer: z.string().min(2, 'Resposta é obrigatória'),
})

export const moderateReviewSchema = z.object({
  isHidden: z.boolean(),
  reason: z.string().min(3, 'Motivo da moderação é obrigatório'),
})

export type CreateReviewInput = z.infer<typeof createReviewSchema>
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>
export type AnswerQuestionInput = z.infer<typeof answerQuestionSchema>
export type ModerateReviewInput = z.infer<typeof moderateReviewSchema>
