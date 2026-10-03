// @vitest-environment node
/// <reference types="vite/client" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// The database mock throws on any model that is not explicitly stubbed, so a
// handler that reaches the database before authorizing fails with a 500.
const { db, getSession } = vi.hoisted(() => {
  const refuse = () => {
    throw new Error('database reached before authorization')
  }
  const stubs: Record<string, unknown> = {
    customer: { findUnique: vi.fn() },
    liveStream: { findUnique: vi.fn() },
    streamHost: { findUnique: vi.fn() },
    session: { deleteMany: vi.fn() },
  }
  const db = new Proxy(stubs, {
    get: (target, prop: string) => target[prop] ?? new Proxy({}, { get: () => refuse }),
  }) as any
  return { db, getSession: vi.fn() }
})

vi.mock('@/lib/db', () => ({ db }))
vi.mock('@/lib/auth/session', () => ({ getSession, verifyToken: vi.fn(async () => null) }))
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => undefined }),
  headers: async () => new Headers(),
}))
vi.mock('@/lib/config', () => ({
  config: {
    database: { url: 'postgresql://test' },
    auth: { jwtSecret: 'test-secret-for-unit-tests-32-chars!!' },
    stripe: { secretKey: 'sk_test_placeholder', webhookSecret: 'whsec_test', publishableKey: 'pk_test_placeholder' },
    coinbase: { apiKey: null, webhookSecret: null },
    resend: { apiKey: 're_test_placeholder' },
    app: { baseUrl: 'http://localhost:3000' },
    livekit: { apiKey: 'devkey', apiSecret: 'secret', wsUrl: 'ws://localhost:7880' },
  },
}))

const routes = import.meta.glob('../../app/api/**/route.ts') as Record<string, () => Promise<Record<string, any>>>

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
type Case = [file: string, method: Method, params?: Record<string, string>]

async function call([file, method, params]: Case, headers: Record<string, string> = {}) {
  const load = routes[`../../app/api/${file}/route.ts`]
  if (!load) throw new Error(`No route file: ${file}`)
  const handler = (await load())[method]
  if (!handler) throw new Error(`${file} has no ${method} handler`)

  // Every identifier a handler might read is supplied, pointing at someone else
  const victim = { customerId: 'victim', creatorId: 'victim', hostId: 'victim-host', role: 'host' }
  const ids = { id: 'x', toyId: 'x', patternId: 'x', sessionId: 'x', goalId: 'x', rewardId: 'x', action: 'feature' }
  const query = new URLSearchParams({ ...victim, ...ids }).toString()
  const hasBody = method !== 'GET' && method !== 'DELETE'

  const request = new NextRequest(`http://localhost/api/${file}?${query}`, {
    method,
    headers,
    body: hasBody ? JSON.stringify({ ...victim, ...ids }) : undefined,
  })
  return handler(request, { params: Promise.resolve(params ?? {}) }) as Promise<Response>
}

const label = ([file, method]: Case) => `${method} /api/${file}`

beforeEach(() => {
  vi.clearAllMocks()
  getSession.mockResolvedValue(null)
  db.customer.findUnique.mockResolvedValue({ isAdmin: false, isHost: false })
  db.liveStream.findUnique.mockResolvedValue({ id: 'x', hostId: 'h-other', host: { customerId: 'someone-else' } })
  db.streamHost.findUnique.mockResolvedValue({ id: 'h-other', customerId: 'someone-else' })
  db.session.deleteMany.mockResolvedValue({ count: 0 })
})

const signedInAsCustomer = () => getSession.mockResolvedValue({ customerId: 'me', email: 'me@example.com' })

describe('admin-only handlers', () => {
  const cases: Case[] = [
    ['admin/segments', 'GET'], ['admin/segments', 'POST'], ['admin/segments', 'PUT'], ['admin/segments', 'DELETE'],
    ['admin/segments/campaigns', 'GET'], ['admin/segments/campaigns', 'POST'], ['admin/segments/campaigns', 'PUT'],
    ['admin/segments/campaigns', 'DELETE'], ['admin/segments/campaigns', 'PATCH'],
    ['admin/rfm', 'GET'], ['admin/rfm', 'POST'],
    ['images/[id]', 'DELETE', { id: 'x' }], ['images/[id]', 'PATCH', { id: 'x' }],
    ['vip/tiers', 'POST'], ['vip/tiers', 'PUT'], ['vip/progress', 'PUT'],
    ['points/rewards', 'POST'], ['hosts', 'POST'],
    ['wellness/achievements', 'POST'], ['wellness/challenges', 'POST'],
    ['wellness/daily-rewards', 'POST'], ['wellness/toy-brands', 'POST'],
    ['experience/configurations', 'POST'], ['experience/sensory', 'POST'], ['experience/3d-models', 'POST'],
    ['experience/features', 'POST'], ['experience/size-visualizer', 'POST'],
    ['gift-cards', 'POST'], ['abandoned-cart', 'GET'], ['abandoned-cart/recover', 'POST'],
    ['admin/audit-logs', 'POST'],
  ]

  it.each(cases.map((c) => [label(c), c] as const))('%s returns 401 without a session', async (_name, c) => {
    expect((await call(c)).status).toBe(401)
  })

  it.each(cases.map((c) => [label(c), c] as const))('%s returns 403 for a non-admin', async (_name, c) => {
    signedInAsCustomer()
    expect((await call(c)).status).toBe(403)
  })
})

describe('stream handlers', () => {
  const ownerOnly: Case[] = [
    ['streams/[id]', 'PUT', { id: 'x' }], ['streams/[id]', 'DELETE', { id: 'x' }],
    ['streams/[id]/start', 'POST', { id: 'x' }], ['streams/[id]/end', 'POST', { id: 'x' }],
    ['streams/[id]/offers', 'POST', { id: 'x' }], ['streams/[id]/products', 'POST', { id: 'x' }],
    ['streams/[id]/token', 'POST', { id: 'x' }],
    ['hosts/[id]', 'PUT', { id: 'x' }],
  ]
  const all: Case[] = [...ownerOnly, ['streams', 'POST']]

  it.each(all.map((c) => [label(c), c] as const))('%s returns 401 without a session', async (_name, c) => {
    expect((await call(c)).status).toBe(401)
  })

  it.each(all.map((c) => [label(c), c] as const))('%s returns 403 for a customer who does not own it', async (_name, c) => {
    signedInAsCustomer()
    expect((await call(c)).status).toBe(403)
  })
})

describe('customer handlers', () => {
  const cases: Case[] = [
    ['points/redeem', 'GET'], ['points/redeem', 'POST'], ['vip/progress', 'GET'],
    ['wellness/toys', 'GET'], ['wellness/toys', 'POST'], ['wellness/toys', 'PUT'], ['wellness/toys', 'DELETE'],
    ['wellness/sessions', 'GET'], ['wellness/sessions', 'POST'], ['wellness/sessions', 'PUT'],
    ['wellness/checkin', 'GET'], ['wellness/checkin', 'POST'],
    ['wellness/streaks', 'GET'], ['wellness/streaks', 'POST'],
    ['wellness/challenges/[id]', 'POST', { id: 'x' }],
    ['wellness/couple-goals', 'GET'], ['wellness/couple-goals', 'POST'], ['wellness/couple-goals', 'PUT'],
    ['wellness/patterns', 'POST'], ['wellness/patterns', 'PUT'], ['wellness/patterns', 'DELETE'],
    ['abandoned-cart', 'POST'], ['recommendations', 'POST'],
  ]

  it.each(cases.map((c) => [label(c), c] as const))('%s returns 401 without a session', async (_name, c) => {
    expect((await call(c)).status).toBe(401)
  })
})

describe('session cookie handlers', () => {
  const cases: Case[] = [
    ['subscriptions', 'GET'], ['subscriptions', 'POST'], ['subscriptions', 'PUT'],
    ['consultations', 'POST'], ['consultations', 'PUT'],
  ]

  it.each(cases.map((c) => [label(c), c] as const))('%s returns 401 without a session', async (_name, c) => {
    expect((await call(c)).status).toBe(401)
  })

  it.each(cases.map((c) => [label(c), c] as const))('%s accepts the calor_session session', async (_name, c) => {
    signedInAsCustomer()
    // Past the guard the throwing database mock produces a 400/404/500 — anything but 401
    expect((await call(c)).status).not.toBe(401)
  })
})

describe('cron handlers', () => {
  const cases: Case[] = [
    ['cron/abandoned-cart', 'POST'], ['cron/gift-cards', 'POST'],
    ['cron/price-alerts', 'POST'], ['cron/price-alerts', 'GET'],
    ['cron/stock-alerts', 'POST'], ['cron/stock-alerts', 'GET'],
  ]

  afterEach(() => {
    delete process.env.CRON_SECRET
  })

  it.each(cases.map((c) => [label(c), c] as const))('%s returns 401 when CRON_SECRET is unset', async (_name, c) => {
    expect((await call(c)).status).toBe(401)
  })

  it.each(cases.map((c) => [label(c), c] as const))('%s returns 401 for a wrong secret', async (_name, c) => {
    process.env.CRON_SECRET = 's3cret'
    expect((await call(c, { authorization: 'Bearer wrong' })).status).toBe(401)
  })
})

describe('other handlers', () => {
  it('POST /api/sessions/revoke only deletes a session owned by the caller', async () => {
    signedInAsCustomer()
    const res = await call(['sessions/revoke', 'POST'])
    expect(res.status).toBe(404)
    expect(db.session.deleteMany).toHaveBeenCalledWith({ where: { id: 'x', customerId: 'me' } })
  })

  it.each([
    ['gift-cards/check'],
    ['checkout/validate-giftcard'],
    ['checkout/validate-promo'],
  ])('POST /api/%s is rate limited per IP', async (file) => {
    const ip = { 'x-forwarded-for': `203.0.113.${Math.floor(Math.random() * 250)}` }
    let last = 0
    for (let i = 0; i < 11; i++) {
      last = (await call([file, 'POST'], ip)).status
    }
    expect(last).toBe(429)
  })
})
