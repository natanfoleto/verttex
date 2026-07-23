import { describe, it, expect } from 'vitest'
import { buildApp } from './app'

describe('RATE-001: Rate Limiting & Brute Force Protection', () => {
  it('should return HTTP 429 Too Many Requests when rate limit threshold on auth route is exceeded', async () => {
    const app = buildApp()
    await app.ready()

    let lastResponse: any

    // Auth rate limit is set to max 20 requests per minute in rate-limit.ts
    // Triggering 22 requests from the same IP to test rate-limiting threshold
    for (let i = 0; i < 22; i++) {
      lastResponse = await app.inject({
        method: 'POST',
        url: '/auth/users/login',
        payload: {
          email: `ratelimit_test_${i}@verttexloja.com.br`,
          password: 'WrongPassword123!',
        },
      })

      if (lastResponse.statusCode === 429) {
        break
      }
    }

    expect(lastResponse.statusCode).toBe(429)
    const body = JSON.parse(lastResponse.body)
    expect(body.error.code).toBe('FST_ERR_RATE_LIMIT_EXCEEDED')

    await app.close()
  })
})
