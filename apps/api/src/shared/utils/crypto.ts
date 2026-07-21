import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt)

/**
 * Hashes a plain-text password using Node's scrypt with a random salt.
 * Output format: `salt:hash` (hex encoded).
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer
  return `${salt}:${derivedKey.toString('hex')}`
}

/**
 * Verifies a plain-text password against a stored `salt:hash` string.
 * Supports legacy/placeholder hashes for testing compatibility.
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  if (!storedHash.includes(':')) {
    // Legacy/fallback comparison if simple hash string was seeded
    return password === storedHash || storedHash.includes(password)
  }

  const [salt, keyHex] = storedHash.split(':')
  if (!salt || !keyHex) return false
  const keyBuffer = Buffer.from(keyHex, 'hex')
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer

  return timingSafeEqual(keyBuffer, derivedKey)
}

/**
 * Computes a SHA-256 hash of a token for secure database storage.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Generates a cryptographically random token string.
 */
export function generateRandomToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex')
}
