import { describe, it, expect } from 'vitest'
import { checkRateLimit } from '@/lib/rate-limit'

describe('Rate Limiter', () => {
  // Use a unique key prefix per test to avoid cross-test contamination
  let keyCounter = 0
  function uniqueKey() {
    return `test-key-${Date.now()}-${keyCounter++}`
  }

  it('should allow the first request', async () => {
    const key = uniqueKey()
    const result = await checkRateLimit(key, { windowMs: 60_000, maxRequests: 5 })
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('should allow requests within the limit', async () => {
    const key = uniqueKey()
    const config = { windowMs: 60_000, maxRequests: 3 }

    const r1 = await checkRateLimit(key, config)
    const r2 = await checkRateLimit(key, config)
    const r3 = await checkRateLimit(key, config)

    expect(r1.allowed).toBe(true)
    expect(r2.allowed).toBe(true)
    expect(r3.allowed).toBe(true)
  })

  it('should reject requests over the limit', async () => {
    const key = uniqueKey()
    const config = { windowMs: 60_000, maxRequests: 2 }

    await checkRateLimit(key, config) // 1st
    await checkRateLimit(key, config) // 2nd
    const r3 = await checkRateLimit(key, config) // 3rd - over limit

    expect(r3.allowed).toBe(false)
    expect(r3.remaining).toBe(0)
  })

  it('should decrease remaining count with each request', async () => {
    const key = uniqueKey()
    const config = { windowMs: 60_000, maxRequests: 5 }

    const r1 = await checkRateLimit(key, config)
    const r2 = await checkRateLimit(key, config)
    const r3 = await checkRateLimit(key, config)

    expect(r1.remaining).toBe(4)
    expect(r2.remaining).toBe(3)
    expect(r3.remaining).toBe(2)
  })

  it('should include a resetAt timestamp in the future', async () => {
    const key = uniqueKey()
    const now = Date.now()
    const result = await checkRateLimit(key, { windowMs: 60_000, maxRequests: 5 })

    expect(result.resetAt).toBeGreaterThan(now)
  })
})
