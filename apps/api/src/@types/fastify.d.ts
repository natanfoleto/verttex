import { defineAbilityFor } from "@verttex/auth";

declare module "fastify" {
  interface FastifyInstance {
    verifyUser(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }
  interface FastifyRequest {
    getCurrentUserAbility(): ReturnType<typeof defineAbilityFor>;
  }
}
