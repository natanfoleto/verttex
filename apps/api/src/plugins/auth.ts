import fp from "fastify-plugin";
import { FastifyRequest, FastifyReply } from "fastify";
import { defineAbilityFor, UserToken } from "@verttex/auth";
import { AppError } from "../shared/errors/app-error";

declare module "fastify" {
  interface FastifyInstance {
    verifyUser(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }
  interface FastifyRequest {
    getCurrentUserAbility(): ReturnType<typeof defineAbilityFor>;
  }
}

export const authPlugin = fp(async (app) => {
  app.decorateRequest("getCurrentUserAbility", function (this: FastifyRequest) {
    const user = (this.user as UserToken) || { id: "anonymous", role: "USER" };
    return defineAbilityFor(user);
  });

  app.decorate(
    "verifyUser",
    async function (request: FastifyRequest, _reply: FastifyReply) {
      try {
        await request.jwtVerify();
      } catch (err) {
        throw new AppError("UNAUTHORIZED", "Não autenticado", 401);
      }
    },
  );
});
