import Fastify from "fastify";
import {
  validatorCompiler,
  serializerCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod";

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
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.setErrorHandler(httpErrorHandler);

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
