import { describe, expect, it, vi } from 'vitest'

import { R2Storage } from './r2'

describe('R2Storage', () => {
  it('rejects an object whose declared size exceeds the download limit', async () => {
    const storage = new R2Storage()
    const send = vi.fn().mockResolvedValue({
      Body: {
        async *[Symbol.asyncIterator]() {
          yield new Uint8Array([1])
        },
      },
      ContentLength: 6,
    })

    Object.assign(storage, { s3: { send } })

    await expect(storage.downloadFile('oversized.png', 5)).rejects.toThrow(
      'excede o limite permitido',
    )
  })

  it('stops streaming when an object exceeds the limit without Content-Length', async () => {
    const storage = new R2Storage()
    const send = vi.fn().mockResolvedValue({
      Body: {
        async *[Symbol.asyncIterator]() {
          yield new Uint8Array([1, 2, 3])
          yield new Uint8Array([4, 5, 6])
        },
      },
    })

    Object.assign(storage, { s3: { send } })

    await expect(storage.downloadFile('oversized.png', 5)).rejects.toThrow(
      'excede o limite permitido',
    )
  })
})
