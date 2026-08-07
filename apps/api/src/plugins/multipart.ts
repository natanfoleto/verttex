import multipart from '@fastify/multipart'
import fp from 'fastify-plugin'

export const multipartPlugin = fp(async (app) => {
  await app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 1,
    },
  })
})
