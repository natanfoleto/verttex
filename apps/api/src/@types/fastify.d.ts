import { defineAbilityFor } from '@verttex/auth'
import {
  FastifyRequest,
  FastifyReply,
  RawServerDefault,
  IncomingMessage,
  FastifySchema,
  RouteGenericInterface,
} from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

export interface AuthenticatedUserPayload {
  id: string
  name: string
  email: string
  role: string
  roleId: string
  sessionId: string
  rolePermissions?: string[]
  permissions?: { permissionKey: string; effect: 'allow' | 'deny' }[]
}

export interface AuthenticatedCustomerPayload {
  id: string
  name: string
  email: string
  sessionId: string
}

export type FastifyZodRequest<
  RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
  SchemaCompiler extends FastifySchema = FastifySchema,
> = FastifyRequest<
  RouteGeneric,
  RawServerDefault,
  IncomingMessage,
  SchemaCompiler,
  ZodTypeProvider
>

declare module 'fastify' {
  interface FastifyInstance {
    verifyUser(request: FastifyRequest, reply: FastifyReply): Promise<void>
    authenticateUser(
      request: FastifyRequest,
      reply: FastifyReply
    ): Promise<void>
    authenticateCustomer(
      request: FastifyRequest,
      reply: FastifyReply
    ): Promise<void>
  }
  interface FastifyRequest {
    userPayload?: AuthenticatedUserPayload
    customerPayload?: AuthenticatedCustomerPayload
    getCurrentUserAbility(): ReturnType<typeof defineAbilityFor>
  }
}
