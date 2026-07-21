import { FastifyReply } from "fastify";
import { FastifyZodRequest } from "../../@types/fastify";
import { AuthCustomersService } from "./auth-customers.service";
import {
  CustomerRegisterBody,
  CustomerLoginBody,
  CustomerForgotPasswordBody,
  CustomerResetPasswordBody,
  CustomerChangePasswordBody,
  UpdateCustomerProfileBody,
} from "./auth-customers.schemas";
import { AppError } from "../../shared/errors/app-error";

const authCustomersService = new AuthCustomersService();
const isProduction = process.env.NODE_ENV === "production";

export async function registerCustomerController(
  request: FastifyZodRequest<{ Body: CustomerRegisterBody }>,
  reply: FastifyReply,
) {
  const result = await authCustomersService.register(
    request.server,
    request.body,
    request.ip,
    request.headers["user-agent"],
  );

  reply
    .setCookie("customer_access_token", result.accessToken, {
      path: "/",
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 15 * 60,
    })
    .setCookie("customer_refresh_token", result.refreshToken, {
      path: "/auth/customers",
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });

  return reply.status(201).send({
    success: true,
    data: result,
  });
}

export async function loginCustomerController(
  request: FastifyZodRequest<{ Body: CustomerLoginBody }>,
  reply: FastifyReply,
) {
  const result = await authCustomersService.login(
    request.server,
    request.body,
    request.ip,
    request.headers["user-agent"],
  );

  reply
    .setCookie("customer_access_token", result.accessToken, {
      path: "/",
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 15 * 60,
    })
    .setCookie("customer_refresh_token", result.refreshToken, {
      path: "/auth/customers",
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });

  return reply.send({
    success: true,
    data: result,
  });
}

export async function logoutCustomerController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  await authCustomersService.logout(request.customerPayload?.sessionId);

  reply
    .clearCookie("customer_access_token", { path: "/" })
    .clearCookie("customer_refresh_token", { path: "/auth/customers" });

  return reply.send({
    success: true,
    data: { message: "Desconectado com sucesso!" },
  });
}

export async function refreshCustomerController(
  request: FastifyZodRequest<{ Body?: { refreshToken?: string } }>,
  reply: FastifyReply,
) {
  const refreshToken =
    request.cookies.customer_refresh_token || request.body?.refreshToken;

  if (!refreshToken) {
    throw new AppError("UNAUTHORIZED", "Refresh token ausente", 401);
  }

  const result = await authCustomersService.refresh(
    request.server,
    refreshToken,
    request.ip,
    request.headers["user-agent"],
  );

  reply
    .setCookie("customer_access_token", result.accessToken, {
      path: "/",
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 15 * 60,
    })
    .setCookie("customer_refresh_token", result.refreshToken, {
      path: "/auth/customers",
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });

  return reply.send({
    success: true,
    data: result,
  });
}

export async function forgotPasswordCustomerController(
  request: FastifyZodRequest<{ Body: CustomerForgotPasswordBody }>,
  reply: FastifyReply,
) {
  const result = await authCustomersService.forgotPassword(request.body);
  return reply.send({
    success: true,
    data: result,
  });
}

export async function resetPasswordCustomerController(
  request: FastifyZodRequest<{ Body: CustomerResetPasswordBody }>,
  reply: FastifyReply,
) {
  const result = await authCustomersService.resetPassword(request.body);

  reply
    .clearCookie("customer_access_token", { path: "/" })
    .clearCookie("customer_refresh_token", { path: "/auth/customers" });

  return reply.send({
    success: true,
    data: result,
  });
}

export async function changePasswordCustomerController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const customerId = request.customerPayload!.id;
  const body = request.body as CustomerChangePasswordBody;
  const result = await authCustomersService.changePassword(customerId, body);

  reply
    .clearCookie("customer_access_token", { path: "/" })
    .clearCookie("customer_refresh_token", { path: "/auth/customers" });

  return reply.send({
    success: true,
    data: result,
  });
}

export async function meCustomerController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const customerId = request.customerPayload!.id;
  const profile = await authCustomersService.getCustomerProfile(customerId);

  return reply.send({
    success: true,
    data: profile,
  });
}

export async function getCustomerProfileController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const customerId = request.customerPayload!.id;
  const profile = await authCustomersService.getCustomerProfile(customerId);

  return reply.send({
    success: true,
    data: profile,
  });
}

export async function updateCustomerProfileController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const customerId = request.customerPayload!.id;
  const body = request.body as UpdateCustomerProfileBody;
  const profile = await authCustomersService.updateCustomerProfile(
    customerId,
    body,
  );

  return reply.send({
    success: true,
    data: profile,
  });
}
