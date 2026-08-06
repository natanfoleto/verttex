import fastifyCookie from '@fastify/cookie'
import { apiEnv } from '@verttex/env/api'
import fp from 'fastify-plugin'

export const cookiePlugin = fp(async (app) => {
  await app.register(fastifyCookie, {
    secret: apiEnv.COOKIE_SECRET,
  })
})
