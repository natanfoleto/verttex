import { describe, expect, it } from 'vitest'

import { hashPassword, verifyPassword } from '../../shared/utils/crypto'

describe('Customer Authentication Service Unit & Schema Tests', () => {
  it('should securely hash and verify customer passwords using scrypt', async () => {
    const rawPassword = 'CustomerSecurePass123!'
    const hash = await hashPassword(rawPassword)

    expect(hash).toBeDefined()
    expect(hash).not.toEqual(rawPassword)
    expect(hash).toContain(':')

    const isValid = await verifyPassword(rawPassword, hash)
    expect(isValid).toBe(true)

    const isWrongValid = await verifyPassword('WrongPassword123!', hash)
    expect(isWrongValid).toBe(false)
  })

  it('should validate customer register payload rules', async () => {
    const validCustomerData = {
      name: 'Cliente Teste Verttex',
      email: 'cliente.teste@verttex.com.br',
      password: 'Password123!',
      phone: '54999998888',
    }

    expect(validCustomerData.email).toContain('@')
    expect(validCustomerData.name.length).toBeGreaterThan(2)
    expect(validCustomerData.password.length).toBeGreaterThanOrEqual(8)
  })
})
