import Fastify from "fastify";
import {
  validatorCompiler,
  serializerCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod";

import { helmetPlugin } from "./plugins/helmet";
import { rateLimitPlugin } from "./plugins/rate-limit";
import { requestContextPlugin } from "./plugins/request-context";
import { corsPlugin } from "./plugins/cors";
import { jwtPlugin } from "./plugins/jwt";
import { cookiePlugin } from "./plugins/cookie";
import { authPlugin } from "./plugins/auth";
import { swaggerPlugin } from "./plugins/swagger";

import { httpErrorHandler } from "./shared/errors/http-error-handler";
import { registerModules } from "./modules";

export function buildApp() {
  const app = Fastify({
    logger: true,
    // Trust 1 level of reverse proxy (Cloudflare / Nginx) for accurate client IP extraction
    trustProxy: 1,
    // Global body limit: 256 KB (prevents payload flood attacks — VULN-010)
    bodyLimit: 256 * 1024,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.setErrorHandler(httpErrorHandler);

  // Security headers — must be registered first
  app.register(helmetPlugin);
  app.register(rateLimitPlugin);

  // Plugins
  app.register(requestContextPlugin);
  app.register(corsPlugin);
  app.register(jwtPlugin);
  app.register(cookiePlugin);
  app.register(authPlugin);
  app.register(swaggerPlugin);

  // Modules routes
  app.register(registerModules);

  return app;
}
