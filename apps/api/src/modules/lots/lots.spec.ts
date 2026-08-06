import { describe, expect, it } from 'vitest'

import { LotsService } from './lots.service'

describe('LotsService — Expiration Condition Analysis', () => {
  it('should return valid condition when expiration is far in the future', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 180)

    const result = LotsService.calculateExpirationCondition(futureDate, 15, 30)
    expect(result.condition).toBe('valid')
    expect(result.isExpired).toBe(false)
    expect(result.daysRemaining).toBeGreaterThanOrEqual(179)
  })

  it('should return warning condition when within warning threshold (e.g. <= 30 days)', () => {
    const warningDate = new Date()
    warningDate.setDate(warningDate.getDate() + 20)

    const result = LotsService.calculateExpirationCondition(warningDate, 15, 30)
    expect(result.condition).toBe('warning')
    expect(result.isExpired).toBe(false)
  })

  it('should return insufficient condition when remaining days are less than min delivery days (e.g. < 15 days)', () => {
    const insufficientDate = new Date()
    insufficientDate.setDate(insufficientDate.getDate() + 10)

    const result = LotsService.calculateExpirationCondition(
      insufficientDate,
      15,
      30,
    )
    expect(result.condition).toBe('insufficient')
    expect(result.isExpired).toBe(false)
  })

  it('should return expired condition when date is in the past', () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 5)

    const result = LotsService.calculateExpirationCondition(pastDate, 15, 30)
    expect(result.condition).toBe('expired')
    expect(result.isExpired).toBe(true)
    expect(result.daysRemaining).toBeLessThan(0)
  })
})
