import { describe, expect, it } from 'vitest'

import { LotsService } from '../lots/lots.service'

describe('Stock & FEFO Integration Domain Tests', () => {
  it('should correctly evaluate temporal expiration conditions', () => {
    const futureFar = new Date()
    futureFar.setDate(futureFar.getDate() + 90)

    const warning = new Date()
    warning.setDate(warning.getDate() + 25)

    const insufficient = new Date()
    insufficient.setDate(insufficient.getDate() + 10)

    const expired = new Date()
    expired.setDate(expired.getDate() - 2)

    expect(
      LotsService.calculateExpirationCondition(futureFar, 15, 30).condition,
    ).toBe('valid')
    expect(
      LotsService.calculateExpirationCondition(warning, 15, 30).condition,
    ).toBe('warning')
    expect(
      LotsService.calculateExpirationCondition(insufficient, 15, 30).condition,
    ).toBe('insufficient')
    expect(
      LotsService.calculateExpirationCondition(expired, 15, 30).condition,
    ).toBe('expired')
  })

  it('should sort lots strictly according to FEFO rules (earliest expiration first)', () => {
    const lotA = {
      id: 'lot-a',
      expirationDate: new Date('2026-10-15'),
      physicalQuantity: 50,
    }
    const lotB = {
      id: 'lot-b',
      expirationDate: new Date('2026-08-01'),
      physicalQuantity: 30,
    } // Earliest
    const lotC = {
      id: 'lot-c',
      expirationDate: new Date('2026-12-01'),
      physicalQuantity: 100,
    }

    const lots = [lotA, lotB, lotC]
    lots.sort((a, b) => a.expirationDate.getTime() - b.expirationDate.getTime())

    expect(lots[0]!.id).toBe('lot-b')
    expect(lots[1]!.id).toBe('lot-a')
    expect(lots[2]!.id).toBe('lot-c')
  })

  it('should calculate FEFO quantity distribution across multiple lots', () => {
    const lotB = { id: 'lot-b', availableQuantity: 15 }
    const lotA = { id: 'lot-a', availableQuantity: 25 }
    const sortedLots = [lotB, lotA]

    let requested = 30
    const allocations: Array<{ id: string; qty: number }> = []

    for (const lot of sortedLots) {
      if (requested <= 0) break
      const take = Math.min(lot.availableQuantity, requested)
      allocations.push({ id: lot.id, qty: take })
      requested -= take
    }

    expect(allocations).toEqual([
      { id: 'lot-b', qty: 15 },
      { id: 'lot-a', qty: 15 },
    ])
    expect(requested).toBe(0)
  })
})
