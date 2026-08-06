import fastifyJwt from '@fastify/jwt'
import { apiEnv } from '@verttex/env/api'
import fp from 'fastify-plugin'

export const jwtPlugin = fp(async (app) => {
  await app.register(fastifyJwt, {
    secret: apiEnv.JWT_SECRET,
  })
})
