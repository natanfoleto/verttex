import { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'

import { requestContextStorage } from '../../plugins/request-context'
import { AppError } from './app-error'

type FastifyErrorHandler = FastifyInstance['errorHandler']

export const httpErrorHandler: FastifyErrorHandler = (
  error,
  request,
  reply,
) => {
  const store = requestContextStorage.getStore()
  const requestId = store?.requestId || 'req_unknown'
  const errAny = error as Record<string, unknown>

  if (error instanceof ZodError) {
    request.log.warn({ err: error }, 'Validation error')
    return reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Os dados enviados são inválidos',
        fieldErrors: error.flatten().fieldErrors,
        requestId,
      },
    })
  }

  // Handle Fastify schema validation errors (when Fastify wraps Zod/AJV validation in error.validation)
  if (
    errAny?.validation &&
    Array.isArray(errAny.validation) &&
    errAny.validation.length > 0
  ) {
    request.log.warn({ err: error }, 'Fastify schema validation error')

    const fieldErrors: Record<string, string[]> = {}
    const friendlyMessages: string[] = []

    for (const item of errAny.validation) {
      const rawPath = (item.instancePath || item.path || '').replace(
        /^\/?(body\/)?/,
        '',
      )
      const fieldName = rawPath || 'body'
      const msg = item.message || 'Campo inválido'

      if (!fieldErrors[fieldName]) {
        fieldErrors[fieldName] = []
      }
      fieldErrors[fieldName].push(msg)

      let formattedField = fieldName
      if (fieldName.includes('variations')) {
        formattedField = fieldName.replace(
          /variations[/.](\d+)[/.]([a-zA-Z0-9_]+)/,
          (_: string, idx: string, prop: string) => {
            const propLabel =
              prop === 'price'
                ? 'Preço'
                : prop === 'sku'
                  ? 'SKU'
                  : prop === 'stock'
                    ? 'Estoque'
                    : prop
            return `Variação #${Number(idx) + 1} (${propLabel})`
          },
        )
      }
      friendlyMessages.push(`${formattedField}: ${msg}`)
    }

    return reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message:
          friendlyMessages.join(' | ') || 'Os dados enviados são inválidos',
        fieldErrors,
        requestId,
      },
    })
  }

  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        fieldErrors: error.fieldErrors,
        requestId,
      },
    })
  }

  const rawStatusCode =
    errAny?.statusCode ||
    (errAny?.error === 'RATE_LIMIT_EXCEEDED' ? 429 : undefined) ||
    (reply.statusCode && reply.statusCode >= 400 && reply.statusCode < 500
      ? reply.statusCode
      : undefined)
  const statusCode = rawStatusCode as number | undefined

  // Handle native Fastify errors (e.g., FST_ERR_CTP_BODY_TOO_LARGE, rate limit 429)
  if (statusCode && statusCode >= 400 && statusCode < 500) {
    const isRateLimit =
      statusCode === 429 || errAny?.error === 'RATE_LIMIT_EXCEEDED'
    request.log.warn({ err: error }, 'Fastify HTTP client error')
    return reply.status(statusCode).send({
      success: false,
      error: {
        code: isRateLimit
          ? 'FST_ERR_RATE_LIMIT_EXCEEDED'
          : errAny?.code || 'HTTP_CLIENT_ERROR',
        message: isRateLimit
          ? errAny?.message || 'Muitas requisições. Tente novamente mais tarde.'
          : statusCode === 413
            ? 'Tamanho da requisição excede o limite máximo permitido (256 KB)'
            : errAny?.message || 'Requisição inválida',
        requestId,
      },
    })
  }

  request.log.error({ err: error }, 'Internal server error')

  return reply.status(500).send({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      requestId,
    },
  })
}
