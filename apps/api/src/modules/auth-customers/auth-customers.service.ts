import { FastifyInstance } from "fastify";
import { prisma } from "../../infrastructure/database/prisma";
import { AppError } from "../../shared/errors/app-error";
import {
  hashPassword,
  verifyPassword,
  hashToken,
  generateRandomToken,
} from "../../shared/utils/crypto";
import {
  CustomerRegisterBody,
  CustomerLoginBody,
  CustomerForgotPasswordBody,
  CustomerResetPasswordBody,
  CustomerChangePasswordBody,
  UpdateCustomerProfileBody,
} from "./auth-customers.schemas";

export class AuthCustomersService {
  async register(
    app: FastifyInstance,
    body: CustomerRegisterBody,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const email = body.email.toLowerCase().trim();

    const existingCustomer = await prisma.customer.findUnique({
      where: { email },
    });

    if (existingCustomer) {
      throw new AppError("CONFLICT", "Este e-mail já está cadastrado", 409);
    }

    const passwordHash = await hashPassword(body.password);

    const customer = await prisma.customer.create({
      data: {
        name: body.name.trim(),
        email,
        phone: body.phone?.trim() || null,
        passwordHash,
        status: "active",
      },
    });

    // Auto-login after registration
    return this.createCustomerSession(app, customer, ipAddress, userAgent);
  }

  async login(
    app: FastifyInstance,
    body: CustomerLoginBody,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const email = body.email.toLowerCase().trim();

    const customer = await prisma.customer.findUnique({
      where: { email },
    });

    if (!customer || customer.status !== "active") {
      throw new AppError("UNAUTHORIZED", "E-mail ou senha inválidos", 401);
    }

    const isPasswordValid = await verifyPassword(
      body.password,
      customer.passwordHash,
    );
    if (!isPasswordValid) {
      throw new AppError("UNAUTHORIZED", "E-mail ou senha inválidos", 401);
    }

    return this.createCustomerSession(app, customer, ipAddress, userAgent);
  }

  private async createCustomerSession(
    app: FastifyInstance,
    customer: { id: string; name: string; email: string },
    ipAddress?: string,
    userAgent?: string,
  ) {
    const rawRefreshToken = generateRandomToken(32);
    const refreshTokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session = await prisma.customerSession.create({
      data: {
        customerId: customer.id,
        refreshTokenHash,
        ipAddress,
        userAgent,
        expiresAt,
      },
    });

    await prisma.customer.update({
      where: { id: customer.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = app.jwt.sign(
      {
        sub: customer.id,
        actorType: "customer",
        sessionId: session.id,
      },
      { expiresIn: "15m" },
    );

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
      },
    };
  }

  async logout(sessionId?: string) {
    if (!sessionId) return;

    await prisma.customerSession.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async refresh(
    app: FastifyInstance,
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const tokenHash = hashToken(refreshToken);

    const session = await prisma.customerSession.findUnique({
      where: { refreshTokenHash: tokenHash },
      include: { customer: true },
    });

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt < new Date() ||
      session.customer.status !== "active"
    ) {
      throw new AppError("UNAUTHORIZED", "Sessão inválida ou expirada", 401);
    }

    // Revoke old session
    await prisma.customerSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    const rawRefreshToken = generateRandomToken(32);
    const newRefreshTokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const newSession = await prisma.customerSession.create({
      data: {
        customerId: session.customerId,
        refreshTokenHash: newRefreshTokenHash,
        ipAddress,
        userAgent,
        expiresAt,
      },
    });

    const accessToken = app.jwt.sign(
      {
        sub: session.customer.id,
        actorType: "customer",
        sessionId: newSession.id,
      },
      { expiresIn: "15m" },
    );

    return {
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  async forgotPassword(body: CustomerForgotPasswordBody) {
    const email = body.email.toLowerCase().trim();
    const customer = await prisma.customer.findUnique({ where: { email } });

    const genericResponse = {
      message:
        "Se existir uma conta associada ao e-mail informado, enviaremos as instruções de recuperação.",
    };

    if (!customer || customer.status !== "active") {
      return genericResponse;
    }

    await prisma.customerPasswordResetToken.updateMany({
      where: { customerId: customer.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const rawToken = generateRandomToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000);

    await prisma.customerPasswordResetToken.create({
      data: {
        customerId: customer.id,
        tokenHash,
        expiresAt,
      },
    });

    console.log(
      `🔑 [DEV CUSTOMER RESET TOKEN] Email: ${email} | Token: ${rawToken}`,
    );

    return genericResponse;
  }

  async resetPassword(body: CustomerResetPasswordBody) {
    const tokenHash = hashToken(body.token);

    const resetToken = await prisma.customerPasswordResetToken.findUnique({
      where: { tokenHash },
      include: { customer: true },
    });

    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt < new Date() ||
      resetToken.customer.status !== "active"
    ) {
      throw new AppError(
        "UNAUTHORIZED",
        "Token de recuperação inválido ou expirado",
        400,
      );
    }

    const newPasswordHash = await hashPassword(body.newPassword);

    await prisma.$transaction([
      prisma.customer.update({
        where: { id: resetToken.customerId },
        data: { passwordHash: newPasswordHash },
      }),
      prisma.customerPasswordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      prisma.customerSession.updateMany({
        where: { customerId: resetToken.customerId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { message: "Senha redefinida com sucesso!" };
  }

  async changePassword(customerId: string, body: CustomerChangePasswordBody) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new AppError("NOT_FOUND", "Cliente não encontrado", 404);
    }

    const isCurrentValid = await verifyPassword(
      body.currentPassword,
      customer.passwordHash,
    );
    if (!isCurrentValid) {
      throw new AppError("VALIDATION_ERROR", "Senha atual incorreta", 400);
    }

    const newPasswordHash = await hashPassword(body.newPassword);

    await prisma.$transaction([
      prisma.customer.update({
        where: { id: customerId },
        data: { passwordHash: newPasswordHash },
      }),
      prisma.customerSession.updateMany({
        where: { customerId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { message: "Senha alterada com sucesso!" };
  }

  async getCustomerProfile(customerId: string) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer || customer.status !== "active") {
      throw new AppError("NOT_FOUND", "Cliente não encontrado", 404);
    }

    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      status: customer.status,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }

  async updateCustomerProfile(
    customerId: string,
    body: UpdateCustomerProfileBody,
  ) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer || customer.status !== "active") {
      throw new AppError("NOT_FOUND", "Cliente não encontrado", 404);
    }

    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: {
        name: body.name ? body.name.trim() : undefined,
        phone: body.phone !== undefined ? body.phone.trim() : undefined,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      status: updated.status,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
}
