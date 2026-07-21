import { FastifyRequest, FastifyReply } from "fastify";
import { AuthUsersService } from "./auth-users.service";
import {
  LoginBody,
  ForgotPasswordBody,
  ResetPasswordBody,
  ChangePasswordBody,
} from "./auth-users.schemas";
import { AppError } from "../../shared/errors/app-error";

const authUsersService = new AuthUsersService();
const isProduction = process.env.NODE_ENV === "production";

export async function loginController(
  request: FastifyRequest<{ Body: LoginBody }>,
  reply: FastifyReply,
) {
  const result = await authUsersService.login(
    request.server,
    request.body,
    request.ip,
    request.headers["user-agent"],
  );

  reply
    .setCookie("user_access_token", result.accessToken, {
      path: "/",
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 15 * 60, // 15 minutes
    })
    .setCookie("user_refresh_token", result.refreshToken, {
      path: "/auth/users",
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

  return reply.send({
    success: true,
    data: result,
  });
}

export async function logoutController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  await authUsersService.logout(request.userPayload?.sessionId);

  reply
    .clearCookie("user_access_token", { path: "/" })
    .clearCookie("user_refresh_token", { path: "/auth/users" });

  return reply.send({
    success: true,
    data: { message: "Desconectado com sucesso!" },
  });
}

export async function refreshController(
  request: FastifyRequest<{ Body?: { refreshToken?: string } }>,
  reply: FastifyReply,
) {
  const refreshToken =
    request.cookies.user_refresh_token || request.body?.refreshToken;

  if (!refreshToken) {
    throw new AppError("UNAUTHORIZED", "Refresh token ausente", 401);
  }

  const result = await authUsersService.refresh(
    request.server,
    refreshToken,
    request.ip,
    request.headers["user-agent"],
  );

  reply
    .setCookie("user_access_token", result.accessToken, {
      path: "/",
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 15 * 60,
    })
    .setCookie("user_refresh_token", result.refreshToken, {
      path: "/auth/users",
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

export async function forgotPasswordController(
  request: FastifyRequest<{ Body: ForgotPasswordBody }>,
  reply: FastifyReply,
) {
  const result = await authUsersService.forgotPassword(request.body);
  return reply.send({
    success: true,
    data: result,
  });
}

export async function resetPasswordController(
  request: FastifyRequest<{ Body: ResetPasswordBody }>,
  reply: FastifyReply,
) {
  const result = await authUsersService.resetPassword(request.body);

  reply
    .clearCookie("user_access_token", { path: "/" })
    .clearCookie("user_refresh_token", { path: "/auth/users" });

  return reply.send({
    success: true,
    data: result,
  });
}

export async function changePasswordController(
  request: FastifyRequest<{ Body: ChangePasswordBody }>,
  reply: FastifyReply,
) {
  const userId = request.userPayload!.id;
  const result = await authUsersService.changePassword(userId, request.body);

  reply
    .clearCookie("user_access_token", { path: "/" })
    .clearCookie("user_refresh_token", { path: "/auth/users" });

  return reply.send({
    success: true,
    data: result,
  });
}

export async function meController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = request.userPayload!.id;
  const profile = await authUsersService.getUserProfile(userId);

  return reply.send({
    success: true,
    data: profile,
  });
}
