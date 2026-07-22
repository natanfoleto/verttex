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
 * Verifies a plain-text password against a stored `salt:hash` string (hex encoded).
 *
 * Returns `false` for any hash that does not conform to the `salt:hash` format.
 * Comparison is performed using `timingSafeEqual` to prevent timing attacks.
 *
 * @security
 * - No legacy/plain-text fallback. All stored hashes must be produced by `hashPassword()`.
 * - If a hash without the `:` separator is encountered, `false` is returned immediately.
 *   This is intentional: it rejects any value that was not produced by this module.
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const separatorIndex = storedHash.indexOf(':')
  if (separatorIndex === -1) {
    // Hash is not in the expected `salt:hash` format.
    // Return false — do NOT compare directly. This rejects any plain-text or
    // improperly formatted value, eliminating the plain-text bypass vector.
    return false
  }

  const salt = storedHash.slice(0, separatorIndex)
  const keyHex = storedHash.slice(separatorIndex + 1)

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
