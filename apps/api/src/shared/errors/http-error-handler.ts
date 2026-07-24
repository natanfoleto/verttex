import { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { AppError } from "./app-error";
import { requestContextStorage } from "../../plugins/request-context";

type FastifyErrorHandler = FastifyInstance["errorHandler"];

export const httpErrorHandler: FastifyErrorHandler = (
  error,
  request,
  reply,
) => {
  const store = requestContextStorage.getStore();
  const requestId = store?.requestId || "req_unknown";

  if (error instanceof ZodError) {
    request.log.warn({ err: error }, "Validation error");
    return reply.status(400).send({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Os dados enviados são inválidos",
        fieldErrors: error.flatten().fieldErrors,
        requestId,
      },
    });
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
    });
  }

  const errAny = error as any;
  const statusCode =
    errAny?.statusCode ||
    (errAny?.error === "RATE_LIMIT_EXCEEDED" ? 429 : undefined) ||
    (reply.statusCode && reply.statusCode >= 400 && reply.statusCode < 500
      ? reply.statusCode
      : undefined);

  // Handle native Fastify errors (e.g., FST_ERR_CTP_BODY_TOO_LARGE, rate limit 429)
  if (statusCode && statusCode >= 400 && statusCode < 500) {
    const isRateLimit =
      statusCode === 429 || errAny?.error === "RATE_LIMIT_EXCEEDED";
    request.log.warn({ err: error }, "Fastify HTTP client error");
    return reply.status(statusCode).send({
      success: false,
      error: {
        code: isRateLimit
          ? "FST_ERR_RATE_LIMIT_EXCEEDED"
          : errAny?.code || "HTTP_CLIENT_ERROR",
        message: isRateLimit
          ? errAny?.message || "Muitas requisições. Tente novamente mais tarde."
          : statusCode === 413
            ? "Tamanho da requisição excede o limite máximo permitido (256 KB)"
            : errAny?.message || "Requisição inválida",
        requestId,
      },
    });
  }

  request.log.error({ err: error }, "Internal server error");

  return reply.status(500).send({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "Internal server error",
      requestId,
    },
  });
};
