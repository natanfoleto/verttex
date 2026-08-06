import Fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod'

import { registerModules } from './modules'
import { authPlugin } from './plugins/auth'
import { cookiePlugin } from './plugins/cookie'
import { corsPlugin } from './plugins/cors'
import { helmetPlugin } from './plugins/helmet'
import { jwtPlugin } from './plugins/jwt'
import { multipartPlugin } from './plugins/multipart'
import { rateLimitPlugin } from './plugins/rate-limit'
import { requestContextPlugin } from './plugins/request-context'
import { swaggerPlugin } from './plugins/swagger'
import { httpErrorHandler } from './shared/errors/http-error-handler'

export function buildApp() {
  const app = Fastify({
    logger: true,
    // Trust 1 level of reverse proxy (Cloudflare / Nginx) for accurate client IP extraction
    trustProxy: 1,
    // Global body limit: 256 KB (prevents payload flood attacks — VULN-010)
    bodyLimit: 256 * 1024,
  }).withTypeProvider<ZodTypeProvider>()

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  app.setErrorHandler(httpErrorHandler)

  // Security headers — must be registered first
  app.register(helmetPlugin)
  app.register(rateLimitPlugin)

  // Plugins
  app.register(multipartPlugin)
  app.register(requestContextPlugin)
  app.register(corsPlugin)
  app.register(jwtPlugin)
  app.register(cookiePlugin)
  app.register(authPlugin)
  app.register(swaggerPlugin)

  // Modules routes
  app.register(registerModules)

  return app
}
