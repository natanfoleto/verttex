import { describe, expect, it } from 'vitest'
import { EmailService } from './infrastructure/email/email.service'

describe('EmailService Security & Resilience', () => {
  it('should gracefully return false when RESEND_API_KEY is unconfigured without throwing errors', async () => {
    const service = new EmailService()
    const result = await service.sendPasswordResetEmail({
      to: 'usuario@verttexloja.com.br',
      userName: 'Usuário Teste <script>alert("xss")</script>',
      resetUrl: 'http://localhost:3000/redefinir-senha?token=abc123token',
    })

    expect(result).toBe(false)
  })
})
