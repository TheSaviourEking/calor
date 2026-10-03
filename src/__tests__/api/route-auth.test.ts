// @vitest-environment node
/// <reference types="vite/client" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

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

// Every handler asserted by a table below; the route inventory checks that
// nothing is left out
const covered = new Set<string>()
function covers<T extends Case[]>(cases: T): T {
  for (const c of cases) covered.add(label(c))
  return cases
}

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
  const cases: Case[] = covers([
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
    ['promotions', 'GET'], ['admin/products/[id]/images', 'GET', { id: 'x' }],
  ])

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
  const all: Case[] = covers([...ownerOnly, ['streams', 'POST']])

  it.each(all.map((c) => [label(c), c] as const))('%s returns 401 without a session', async (_name, c) => {
    expect((await call(c)).status).toBe(401)
  })

  it.each(all.map((c) => [label(c), c] as const))('%s returns 403 for a customer who does not own it', async (_name, c) => {
    signedInAsCustomer()
    expect((await call(c)).status).toBe(403)
  })
})

describe('customer handlers', () => {
  const cases: Case[] = covers([
    ['points/redeem', 'GET'], ['points/redeem', 'POST'], ['vip/progress', 'GET'],
    ['wellness/toys', 'GET'], ['wellness/toys', 'POST'], ['wellness/toys', 'PUT'], ['wellness/toys', 'DELETE'],
    ['wellness/sessions', 'GET'], ['wellness/sessions', 'POST'], ['wellness/sessions', 'PUT'],
    ['wellness/checkin', 'GET'], ['wellness/checkin', 'POST'],
    ['wellness/streaks', 'GET'], ['wellness/streaks', 'POST'],
    ['wellness/challenges/[id]', 'POST', { id: 'x' }],
    ['wellness/couple-goals', 'GET'], ['wellness/couple-goals', 'POST'], ['wellness/couple-goals', 'PUT'],
    ['wellness/patterns', 'POST'], ['wellness/patterns', 'PUT'], ['wellness/patterns', 'DELETE'],
    ['abandoned-cart', 'POST'], ['recommendations', 'POST'],
  ])

  it.each(cases.map((c) => [label(c), c] as const))('%s returns 401 without a session', async (_name, c) => {
    expect((await call(c)).status).toBe(401)
  })
})

describe('session cookie handlers', () => {
  const cases: Case[] = covers([
    ['subscriptions', 'GET'], ['subscriptions', 'POST'], ['subscriptions', 'PUT'],
    ['consultations', 'POST'], ['consultations', 'PUT'],
  ])

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
  const cases: Case[] = covers([
    ['cron/abandoned-cart', 'POST'], ['cron/gift-cards', 'POST'],
    ['cron/price-alerts', 'POST'], ['cron/price-alerts', 'GET'],
    ['cron/stock-alerts', 'POST'], ['cron/stock-alerts', 'GET'],
  ])

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
  covers([['sessions/revoke', 'POST']])

  it('POST /api/sessions/revoke only deletes a session owned by the caller', async () => {
    signedInAsCustomer()
    const res = await call(['sessions/revoke', 'POST'])
    expect(res.status).toBe(404)
    expect(db.session.deleteMany).toHaveBeenCalledWith({ where: { id: 'x', customerId: 'me' } })
  })

  const rateLimited = [
    'gift-cards/check',
    'checkout/validate-giftcard',
    'checkout/validate-promo',
    'promotions/check',
    'referrals/validate',
  ]
  covers(rateLimited.map((file): Case => [file, 'POST']))

  it.each(rateLimited.map((file) => [file]))('POST /api/%s is rate limited per IP', async (file) => {
    const ip = { 'x-forwarded-for': `203.0.113.${Math.floor(Math.random() * 250)}` }
    let last = 0
    for (let i = 0; i < 11; i++) {
      last = (await call([file, 'POST'], ip)).status
    }
    expect(last).toBe(429)
  })
})

// Handlers that are public by design. Each entry needs a reason; anything that
// writes data or returns one customer's data does not belong here.
const PUBLIC_HANDLERS: string[] = [
  // Health check: static JSON
  'GET /api/',

  // Sign-in, sign-up and token flows: there is no session yet; each checks its
  // own credential, token or OAuth state
  'POST /api/auth/login', 'POST /api/auth/register', 'POST /api/auth/forgot-password',
  'POST /api/auth/reset-password', 'GET /api/auth/verify-email',
  'GET /api/auth/oauth/google', 'POST /api/auth/oauth/google',
  'GET /api/auth/oauth/apple', 'POST /api/auth/oauth/apple',
  // Logout only destroys the caller's own cookie session
  'POST /api/auth/logout',

  // Payment provider webhooks: authenticated by signature, not session
  'POST /api/stripe/webhook', 'POST /api/crypto/webhook',

  // Checkout helpers: the checkout session id is an unguessable capability;
  // the Stripe success lookup needs the Stripe session id
  'GET /api/checkout/session', 'GET /api/subscriptions/success',
  // Address lookup proxies the maps provider for the checkout form; no customer data
  'GET /api/address/autocomplete', 'GET /api/address/details',

  // Anonymous storefront writes that do not touch customer or money data
  'POST /api/newsletter', 'POST /api/quiz/submit', 'POST /api/chatbot/feedback',
  // Anonymous gift notice: rate limited and only sent for a matching gift order
  'POST /api/anonymous-gift',
  // Chatbot history: keyed by the widget's random conversation id
  'GET /api/chatbot',

  // Read-only lookups of published catalogue data posted as a body
  'POST /api/wishlist', 'POST /api/products/stock', 'POST /api/search/semantic',
  // Shared wishlist: the share code is the capability
  'GET /api/wishlist/shared',

  // Catalogue and content GETs (public data only; some seed defaults when empty)
  'GET /api/blog', 'GET /api/bundles', 'GET /api/consultants', 'GET /api/exchange-rates',
  'GET /api/flash-sales', 'GET /api/gift-wrapping', 'GET /api/packaging-photos', 'GET /api/pitch-deck',
  'GET /api/products/stock', 'GET /api/products/[id]/views', 'GET /api/quiz/questions',
  'GET /api/recommendations/product/[id]', 'GET /api/search', 'GET /api/size-guides',
  'GET /api/subscriptions/plans', 'GET /api/tickets/categories', 'GET /api/vip/tiers',
  'GET /api/wellness/daily-rewards', 'GET /api/wellness/toy-brands',
  'GET /api/experience/3d-models', 'GET /api/experience/configurations', 'GET /api/experience/experiences',
  'GET /api/experience/features', 'GET /api/experience/sensory', 'GET /api/experience/size-visualizer',

  // Which payment methods this deployment offers (three booleans, no details)
  'GET /api/payment/methods',

  // Live shopping, viewer side: host directory and public stream data
  // (lists omit stream keys and passwords; chat returns display fields only)
  'GET /api/hosts', 'GET /api/hosts/[id]',
  'GET /api/streams/live', 'GET /api/streams/replays', 'GET /api/streams/schedule',
  'GET /api/streams/[id]/chat', 'GET /api/streams/[id]/offers', 'GET /api/streams/[id]/products',
]

// FINDINGS: handlers that need an ownership check but are not a one-line guard.
// They are listed so the inventory stays green; they are NOT public by design
// and are reported for follow-up. Remove each entry when it is fixed.
const KNOWN_FINDINGS: string[] = [
  // Records an unverified registry purchase; registryItemId is not scoped to the registry
  'POST /api/registry/[id]/purchases',
  // Anyone can increment purchaseCount on arbitrary product ids
  'POST /api/quiz/convert',
]

// Guard calls that mark a handler as authorized. This source scan is only a
// backstop for handlers not yet in a table; the tables above are the real
// assertion that the guard works.
const GUARD_CALL = /getSession\(|requireAdmin|adminApiHandler\(|requireCustomer\(|requireAdminUser\(|requireHostProfile\(|requireStreamOwner\(|isAuthorizedCron\(/

const METHODS: Method[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

// The source of one exported handler: from its `export` to the next top-level `export`
function handlerSource(source: string, method: Method): string | null {
  const start = source.search(new RegExp(`export\\s+(async\\s+)?(function\\s+${method}\\b|const\\s+${method}\\b)`))
  if (start === -1) return null
  const rest = source.slice(start + 1)
  const next = rest.search(/\nexport\s/)
  return next === -1 ? source.slice(start) : source.slice(start, start + 1 + next)
}

describe('route inventory', () => {
  // Some route modules construct an SDK client at import time
  beforeEach(() => {
    vi.stubEnv('STRIPE_SECRET_KEY', process.env.STRIPE_SECRET_KEY || 'sk_test_inventory')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('PUBLIC_HANDLERS and KNOWN_FINDINGS name real handlers that no table covers', async () => {
    for (const name of [...PUBLIC_HANDLERS, ...KNOWN_FINDINGS]) {
      expect(covered.has(name), `${name} is in a table and an allowlist`).toBe(false)
      const [method, path] = name.split(' ')
      const file = path.replace(/^\/api\/?/, '')
      const key = file ? `../../app/api/${file}/route.ts` : '../../app/api/route.ts'
      expect(routes[key], `${name}: no route file`).toBeDefined()
      expect(typeof (await routes[key]())[method], `${name}: no such handler`).toBe('function')
    }
  })

  it('every handler is in a table above, guarded, or explicitly public', { timeout: 60_000 }, async () => {
    const publicSet = new Set([...PUBLIC_HANDLERS, ...KNOWN_FINDINGS])
    const uncovered: string[] = []

    for (const [key, load] of Object.entries(routes)) {
      const file = key.replace(/^\.\.\/\.\.\/app\/api\//, '').replace(/\/?route\.ts$/, '')
      let mod: Record<string, unknown>
      try {
        mod = await load()
      } catch (error) {
        uncovered.push(`/api/${file} (failed to import: ${(error as Error).message})`)
        continue
      }
      const source = readFileSync(fileURLToPath(new URL(key, import.meta.url)), 'utf8')

      for (const method of METHODS) {
        if (typeof mod[method] !== 'function') continue
        const name = label([file, method])
        if (covered.has(name) || publicSet.has(name)) continue
        const body = handlerSource(source, method) ?? ''
        if (GUARD_CALL.test(body)) continue
        uncovered.push(name)
      }
    }

    expect(uncovered, `Unprotected handlers:\n${uncovered.join('\n')}`).toEqual([])
  })
})
