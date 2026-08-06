import { defineAbilityFor } from '@verttex/auth'
import {
  FastifyReply,
  FastifyRequest,
  FastifySchema,
  IncomingMessage,
  RawServerDefault,
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
  interface FastifyRequest {
    userPayload?: AuthenticatedUserPayload
    customerPayload?: AuthenticatedCustomerPayload
    customer?: AuthenticatedCustomerPayload
    getCurrentUserAbility(): ReturnType<typeof defineAbilityFor>
  }
  interface FastifyInstance {
    verifyUser(request: FastifyRequest, reply: FastifyReply): Promise<void>
    authenticateUser(
      request: FastifyRequest,
      reply: FastifyReply,
    ): Promise<void>
    authenticateCustomer(
      request: FastifyRequest,
      reply: FastifyReply,
    ): Promise<void>
  }
}
