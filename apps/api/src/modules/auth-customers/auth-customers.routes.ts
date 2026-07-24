import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  registerCustomerController,
  loginCustomerController,
  logoutCustomerController,
  refreshCustomerController,
  forgotPasswordCustomerController,
  resetPasswordCustomerController,
  changePasswordCustomerController,
  meCustomerController,
} from "./auth-customers.controller";
import {
  customerRegisterBodySchema,
  customerLoginBodySchema,
  customerForgotPasswordBodySchema,
  customerResetPasswordBodySchema,
  customerChangePasswordBodySchema,
} from "./auth-customers.schemas";

const isDev = process.env.NODE_ENV === "development";

export async function authCustomersRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.post(
    "/register",
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "1 hour",
          keyGenerator: (req) => `register:ip:${req.ip}`,
          allowList: () => isDev,
          errorResponseBuilder: (_req, context) => ({
            success: false,
            error: "RATE_LIMIT_EXCEEDED",
            message: `Muitas tentativas de cadastro. Tente novamente em ${Math.ceil(context.ttl / 60000)} minuto(s).`,
            retryAfter: Math.ceil(context.ttl / 1000),
          }),
        },
      },
      schema: {
        tags: ["Auth — Marketplace Customers"],
        summary: "Criar conta de cliente comprador",
        body: customerRegisterBodySchema,
      },
    },
    registerCustomerController,
  );

  typedApp.post(
    "/login",
    {
      config: {
        rateLimit: {
          max: 20,
          timeWindow: "15 minutes",
          keyGenerator: (req) => `cust-login:ip:${req.ip}`,
          allowList: () => isDev,
          errorResponseBuilder: (_req, context) => ({
            success: false,
            error: "RATE_LIMIT_EXCEEDED",
            message: `Muitas tentativas de login. Tente novamente em ${Math.ceil(context.ttl / 1000)} segundo(s).`,
            retryAfter: Math.ceil(context.ttl / 1000),
          }),
        },
      },
      schema: {
        tags: ["Auth — Marketplace Customers"],
        summary: "Autenticar cliente comprador",
        body: customerLoginBodySchema,
      },
    },
    loginCustomerController,
  );

  typedApp.post(
    "/logout",
    {
      preHandler: [app.authenticateCustomer],
      schema: {
        tags: ["Auth — Marketplace Customers"],
        summary: "Encerrar sessão do cliente comprador",
        security: [{ bearerAuth: [] }],
      },
    },
    logoutCustomerController,
  );

  typedApp.post(
    "/refresh",
    {
      config: {
        rateLimit: {
          max: 30,
          timeWindow: "15 minutes",
          keyGenerator: (req) => `cust-refresh:ip:${req.ip}`,
          allowList: () => isDev,
        },
      },
      schema: {
        tags: ["Auth — Marketplace Customers"],
        summary: "Renovar token de acesso do cliente comprador",
      },
    },
    refreshCustomerController,
  );

  typedApp.post(
    "/forgot-password",
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "30 minutes",
          keyGenerator: (req) => `cust-forgot:ip:${req.ip}`,
          allowList: () => isDev,
          errorResponseBuilder: (_req, context) => ({
            success: false,
            error: "RATE_LIMIT_EXCEEDED",
            message: `Muitas solicitações de recuperação. Tente novamente em ${Math.ceil(context.ttl / 60000)} minuto(s).`,
            retryAfter: Math.ceil(context.ttl / 1000),
          }),
        },
      },
      schema: {
        tags: ["Auth — Marketplace Customers"],
        summary: "Solicitar recuperação de senha do cliente",
        body: customerForgotPasswordBodySchema,
      },
    },
    forgotPasswordCustomerController,
  );

  typedApp.post(
    "/reset-password",
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "15 minutes",
          keyGenerator: (req) => `cust-reset:ip:${req.ip}`,
          allowList: () => isDev,
        },
      },
      schema: {
        tags: ["Auth — Marketplace Customers"],
        summary: "Redefinir senha do cliente via token",
        body: customerResetPasswordBodySchema,
      },
    },
    resetPasswordCustomerController,
  );

  typedApp.post(
    "/change-password",
    {
      preHandler: [app.authenticateCustomer],
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "15 minutes",
          keyGenerator: (req) => {
            const payload = (req as any).customerPayload;
            return `cust-change-pwd:${payload?.id ?? req.ip}`;
          },
          allowList: () => isDev,
        },
      },
      schema: {
        tags: ["Auth — Marketplace Customers"],
        summary: "Alterar própria senha do cliente",
        security: [{ bearerAuth: [] }],
        body: customerChangePasswordBodySchema,
      },
    },
    changePasswordCustomerController,
  );

  typedApp.get(
    "/me",
    {
      preHandler: [app.authenticateCustomer],
      schema: {
        tags: ["Auth — Marketplace Customers"],
        summary: "Retornar dados do cliente autenticado",
        security: [{ bearerAuth: [] }],
      },
    },
    meCustomerController,
  );
}
