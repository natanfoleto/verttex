import { defineAbilityFor } from "@verttex/auth";
import { FastifyRequest, FastifyReply } from "fastify";

export interface AuthenticatedUserPayload {
  id: string;
  name: string;
  email: string;
  role: string;
  roleId: string;
  sessionId: string;
}

export interface AuthenticatedCustomerPayload {
  id: string;
  name: string;
  email: string;
  sessionId: string;
}

declare module "fastify" {
  interface FastifyInstance {
    verifyUser(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    authenticateUser(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    authenticateCustomer(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }
  interface FastifyRequest {
    userPayload?: AuthenticatedUserPayload;
    customerPayload?: AuthenticatedCustomerPayload;
    getCurrentUserAbility(): ReturnType<typeof defineAbilityFor>;
  }
}
