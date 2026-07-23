import { Resend } from 'resend'
import { env } from '@verttex/env/api'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Transactional Email Service using Resend.
 *
 * Designed to handle password reset, email verification, and transactional notifications.
 * If RESEND_API_KEY is not configured, email sending is skipped with a dev warning log.
 *
 * @security SECRETS_MANAGEMENT.md
 */
export class EmailService {
  private resend: Resend | null = null
  private defaultFrom = 'Verttex <no-reply@verttexloja.com.br>'

  constructor() {
    if (env.RESEND_API_KEY) {
      this.resend = new Resend(env.RESEND_API_KEY)
    }
  }

  /**
   * Sends a password reset email to a management user or customer.
   */
  async sendPasswordResetEmail(options: {
    to: string
    userName: string
    resetUrl: string
    actorType?: 'user' | 'customer'
  }): Promise<boolean> {
    if (!this.resend) {
      console.warn(
        `[EmailService] RESEND_API_KEY não configurada. E-mail de redefinição de senha para "${options.to}" ignorado.`
      )
      return false
    }

    try {
      const sanitizedName = escapeHtml(options.userName)
      const subject = 'Redefinição de Senha — Verttex'
      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #18181b;">
          <h2 style="color: #059669; font-size: 20px;">Verttex</h2>
          <p>Olá, <strong>${sanitizedName}</strong>,</p>
          <p>Recebemos uma solicitação de redefinição de senha para a sua conta no Verttex.</p>
          <p>Clique no botão abaixo para criar uma nova senha. O link é válido por 1 hora:</p>
          <div style="margin: 24px 0;">
            <a href="${options.resetUrl}" style="background-color: #059669; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              Redefinir Minha Senha
            </a>
          </div>
          <p style="font-size: 12px; color: #71717a;">
            Se você não solicitou a redefinição de senha, ignore este e-mail. Sua senha continuará a mesma.
          </p>
        </div>
      `

      await this.resend.emails.send({
        from: this.defaultFrom,
        to: [options.to],
        subject,
        html,
      })

      return true
    } catch (error) {
      console.error('[EmailService] Falha ao enviar e-mail via Resend:', error)
      return false
    }
  }
}

export const emailService = new EmailService()
