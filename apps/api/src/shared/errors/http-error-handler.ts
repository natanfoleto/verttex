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
