import fastifyCors from '@fastify/cors'
import { apiEnv } from '@verttex/env/api'
import fp from 'fastify-plugin'

export const corsPlugin = fp(async (app) => {
  const allowedOrigins = apiEnv.CORS_ORIGIN.split(',')

  await app.register(fastifyCors, {
    origin: (origin, cb) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes('*')
      ) {
        cb(null, true)
      } else {
        cb(new Error('Not allowed by CORS'), false)
      }
    },
    credentials: true,
  })
})
