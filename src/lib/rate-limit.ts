import { Redis } from '@upstash/redis'

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

// In-memory backend
const memoryStore = new Map<string, { count: number; resetAt: number }>()

setInterval(() => {
  const now = Date.now()
  for (const [key, value] of memoryStore) {
    if (now > value.resetAt) memoryStore.delete(key)
  }
}, 60_000)

function memoryCheck(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const entry = memoryStore.get(key)

  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + config.windowMs })
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs }
  }

  entry.count++
  if (entry.count > config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt }
}

// Redis backend
let redis: Redis | null = null
let redisWarned = false

function getRedis(): Redis | null {
  if (redis) return redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (url && token) {
    redis = new Redis({ url, token })
    return redis
  }
  if (!redisWarned) {
    console.warn('[rate-limit] UPSTASH_REDIS_REST_URL not configured — using in-memory rate limiting (not suitable for multi-instance deployments)')
    redisWarned = true
  }
  return null
}

async function redisCheck(redisClient: Redis, key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const windowSeconds = Math.ceil(config.windowMs / 1000)
  const redisKey = `rl:${key}`

  const count = await redisClient.incr(redisKey)
  if (count === 1) {
    await redisClient.expire(redisKey, windowSeconds)
  }

  const ttl = await redisClient.ttl(redisKey)
  const resetAt = Date.now() + (ttl > 0 ? ttl * 1000 : config.windowMs)

  if (count > config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt }
  }

  return { allowed: true, remaining: config.maxRequests - count, resetAt }
}

// Public API
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig = { windowMs: 60_000, maxRequests: 10 }
): Promise<RateLimitResult> {
  const redisClient = getRedis()
  if (redisClient) {
    try {
      return await redisCheck(redisClient, key, config)
    } catch {
      // Fall back to in-memory if Redis fails
      return memoryCheck(key, config)
    }
  }
  return memoryCheck(key, config)
}

export async function rateLimitByIp(
  request: Request,
  prefix: string,
  config?: RateLimitConfig
): Promise<RateLimitResult> {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown'
  return checkRateLimit(`${prefix}:${ip}`, config)
}
