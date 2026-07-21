import { FastifyRequest, FastifyReply } from "fastify";
import { AppError } from "../errors/app-error";
import { prisma } from "../../infrastructure/database/prisma";

export function requireStoreAccess(storeIdParam: string = "storeId") {
  return async function (request: FastifyRequest, _reply: FastifyReply) {
    if (!request.userPayload) {
      throw new AppError("UNAUTHORIZED", "Não autenticado", 401);
    }

    const { role, id: userId } = request.userPayload;

    // Admin users have global access to all stores
    if (role === "admin") {
      return;
    }

    const params = request.params as Record<string, string>;
    const storeId = params[storeIdParam];

    if (!storeId) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Identificador da loja não informado",
        400,
      );
    }

    const storeUser = await prisma.storeUser.findUnique({
      where: {
        storeId_userId: {
          storeId,
          userId,
        },
      },
    });

    if (!storeUser || !storeUser.isActive) {
      throw new AppError(
        "FORBIDDEN",
        "Você não possui acesso a esta loja",
        403,
      );
    }
  };
}
