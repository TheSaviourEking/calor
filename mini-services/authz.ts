import type { RealtimeUser } from './realtime-token'

// Pure authorization rules shared by the socket services.

export function isAdmin(user: RealtimeUser | null | undefined): boolean {
  return user?.isAdmin === true
}

// A stream is controlled by its own host or by any admin.
export function canControlStream(
  user: RealtimeUser | null | undefined,
  stream: { hostId: string } | null | undefined
): boolean {
  if (!user || !stream) return false
  if (user.isAdmin) return true

  return !!user.hostId && user.hostId === stream.hostId
}

// Returns a trimmed message no longer than maxLength, or null if there is nothing usable.
export function cleanMessage(input: unknown, maxLength: number): string | null {
  if (typeof input !== 'string') return null

  const trimmed = input.trim()
  if (!trimmed) return null

  return trimmed.slice(0, maxLength)
}

// Token bucket per key. Returns true (and spends a token) when the key may act.
// Buckets that are full and unused for IDLE_EVICT_MS are dropped on access, so memory stays bounded.
const IDLE_EVICT_MS = 60_000

export function createRateLimiter(
  capacity: number,
  refillPerSecond: number,
  now: () => number = Date.now
): (key: string) => boolean {
  const buckets = new Map<string, { tokens: number; at: number }>()
  let lastSweep = now()

  return (key: string): boolean => {
    const t = now()

    if (t - lastSweep >= IDLE_EVICT_MS) {
      lastSweep = t
      for (const [k, b] of buckets) {
        const full = Math.min(capacity, b.tokens + ((t - b.at) / 1000) * refillPerSecond) >= capacity
        if (full && t - b.at >= IDLE_EVICT_MS) buckets.delete(k)
      }
    }

    const bucket = buckets.get(key) ?? { tokens: capacity, at: t }
    const tokens = Math.min(capacity, bucket.tokens + ((t - bucket.at) / 1000) * refillPerSecond)

    if (tokens < 1) {
      buckets.set(key, { tokens, at: t })
      return false
    }

    buckets.set(key, { tokens: tokens - 1, at: t })
    return true
  }
}
