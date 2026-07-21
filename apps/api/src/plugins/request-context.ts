import { AsyncLocalStorage } from 'node:async_hooks'
import fp from 'fastify-plugin'

export interface RequestContextStore {
  requestId: string
  actorId?: string | null
  actorType?: 'USER' | 'SYSTEM'
  ipAddress?: string | null
  userAgent?: string | null
}

export const requestContextStorage =
  new AsyncLocalStorage<RequestContextStore>()

export const requestContextPlugin = fp(async (app) => {
  app.addHook('onRequest', (request, reply, done) => {
    const requestId =
      (request.headers['x-request-id'] as string) ||
      `req_${Math.random().toString(36).substring(2, 9)}`
    reply.header('x-request-id', requestId)

    requestContextStorage.run(
      {
        requestId,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] || null,
      },
      done
    )
  })
})
