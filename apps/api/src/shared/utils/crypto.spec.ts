import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword, hashToken, generateRandomToken } from './crypto'

describe('Crypto Utility (Security & Password Hashing)', () => {
  it('should hash a password and verify it successfully with the correct password', async () => {
    const password = 'mySuperSecurePassword123!'
    const hash = await hashPassword(password)

    expect(hash).toContain(':')
    const isValid = await verifyPassword(password, hash)
    expect(isValid).toBe(true)
  })

  it('should fail verification when the wrong password is provided', async () => {
    const password = 'mySuperSecurePassword123!'
    const hash = await hashPassword(password)

    const isValid = await verifyPassword('WrongPassword123!', hash)
    expect(isValid).toBe(false)
  })

  it('CRITICAL VULNERABILITY TEST (VULN-001): should strictly reject hashes that do not contain the ":" separator', async () => {
    // Tests that plain-text passwords or improperly formatted hashes are rejected
    const plainTextHash = 'mySuperSecurePassword123!'
    const isValid = await verifyPassword('mySuperSecurePassword123!', plainTextHash)

    expect(isValid).toBe(false)
  })

  it('should generate random tokens of specified byte length in hex format', () => {
    const token = generateRandomToken(32)
    expect(token).toHaveLength(64) // 32 bytes = 64 hex chars

    const hash = hashToken(token)
    expect(hash).toHaveLength(64) // SHA-256 output is 64 hex chars
  })
})
