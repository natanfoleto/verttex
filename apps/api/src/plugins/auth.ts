import fp from "fastify-plugin";
import { FastifyRequest, FastifyReply } from "fastify";
import { defineAbilityFor, UserToken } from "@verttex/auth";
import { AppError } from "../shared/errors/app-error";
import { prisma } from "../infrastructure/database/prisma";

export const authPlugin = fp(async (app) => {
  app.decorateRequest("getCurrentUserAbility", function (this: FastifyRequest) {
    const roleKey = this.userPayload?.role || "USER";
    const user: UserToken = {
      id: this.userPayload?.id || "anonymous",
      role: roleKey as any,
    };
    return defineAbilityFor(user);
  });

  app.decorate(
    "authenticateUser",
    async function (request: FastifyRequest, _reply: FastifyReply) {
      try {
        let token: string | undefined = request.cookies.user_access_token;

        if (!token && request.headers.authorization) {
          const parts = request.headers.authorization.split(" ");
          if (parts.length === 2 && parts[0] === "Bearer") {
            token = parts[1];
          }
        }

        if (!token) {
          throw new AppError("UNAUTHORIZED", "Não autenticado", 401);
        }

        const decoded = app.jwt.verify<{
          sub: string;
          actorType: string;
          role: string;
          sessionId: string;
        }>(token);

        if (decoded.actorType !== "user") {
          throw new AppError("UNAUTHORIZED", "Token inválido para este contexto", 401);
        }

        const session = await prisma.userSession.findUnique({
          where: { id: decoded.sessionId },
          include: { user: { include: { role: true } } },
        });

        if (
          !session ||
          session.revokedAt ||
          session.expiresAt < new Date() ||
          session.user.status !== "active"
        ) {
          throw new AppError("UNAUTHORIZED", "Sessão inválida ou expirada", 401);
        }

        request.userPayload = {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: session.user.role.key,
          roleId: session.user.roleId,
          sessionId: session.id,
        };
      } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError("UNAUTHORIZED", "Sessão inválida ou expirada", 401);
      }
    },
  );

  app.decorate(
    "authenticateCustomer",
    async function (request: FastifyRequest, _reply: FastifyReply) {
      try {
        let token: string | undefined = request.cookies.customer_access_token;

        if (!token && request.headers.authorization) {
          const parts = request.headers.authorization.split(" ");
          if (parts.length === 2 && parts[0] === "Bearer") {
            token = parts[1];
          }
        }

        if (!token) {
          throw new AppError("UNAUTHORIZED", "Não autenticado", 401);
        }

        const decoded = app.jwt.verify<{
          sub: string;
          actorType: string;
          sessionId: string;
        }>(token);

        if (decoded.actorType !== "customer") {
          throw new AppError("UNAUTHORIZED", "Token inválido para este contexto", 401);
        }

        const session = await prisma.customerSession.findUnique({
          where: { id: decoded.sessionId },
          include: { customer: true },
        });

        if (
          !session ||
          session.revokedAt ||
          session.expiresAt < new Date() ||
          session.customer.status !== "active"
        ) {
          throw new AppError("UNAUTHORIZED", "Sessão inválida ou expirada", 401);
        }

        request.customerPayload = {
          id: session.customer.id,
          name: session.customer.name,
          email: session.customer.email,
          sessionId: session.id,
        };
      } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError("UNAUTHORIZED", "Sessão inválida ou expirada", 401);
      }
    },
  );
});
