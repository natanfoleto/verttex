import fp from "fastify-plugin";
import fastifyCookie from "@fastify/cookie";
import { apiEnv } from "@verttex/env/api";

export const cookiePlugin = fp(async (app) => {
  await app.register(fastifyCookie, {
    secret: apiEnv.COOKIE_SECRET,
  });
});
