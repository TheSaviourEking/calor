// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

type Fn = ReturnType<typeof vi.fn>
type ModelMock = Record<string, Fn>

// A Prisma-like client whose model methods are created on first use, with
// harmless defaults. Tests override the ones they care about.
function defaultFor(method: string) {
  switch (method) {
    case 'findMany':
      return []
    case 'findUnique':
    case 'findFirst':
      return null
    case 'count':
      return 0
    case 'deleteMany':
    case 'updateMany':
      return { count: 0 }
    default:
      return {}
  }
}

function makeClient() {
  const models: Record<string, ModelMock> = {}
  const client = new Proxy({} as Record<string, ModelMock>, {
    get(_t, model: string) {
      if (!models[model]) {
        models[model] = new Proxy({} as ModelMock, {
          get(target, method: string) {
            if (!target[method]) target[method] = vi.fn(async () => defaultFor(method))
            return target[method]
          },
        })
      }
      return models[model]
    },
  })
  return { client, models }
}

const h = vi.hoisted(() => ({
  getSession: vi.fn(),
  verifyPassword: vi.fn(),
  destroySession: vi.fn(),
  checkRateLimit: vi.fn(),
  state: {} as { db: Record<string, unknown>; tx: unknown },
}))

vi.mock('@/lib/db', () => ({
  get db() {
    return h.state.db
  },
}))
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: h.checkRateLimit }))
vi.mock('@/lib/auth/session', () => ({
  getSession: h.getSession,
  verifyPassword: h.verifyPassword,
  destroySession: h.destroySession,
}))

const ME = 'cust_1'

let dbModels: Record<string, ModelMock>
let txModels: Record<string, ModelMock>
let transaction: Fn

beforeEach(() => {
  vi.clearAllMocks()
  const d = makeClient()
  const t = makeClient()
  dbModels = d.models
  txModels = t.models
  transaction = vi.fn(async (cb: (tx: unknown) => unknown) => cb(t.client))
  h.state.db = new Proxy(d.client, {
    get(target, key: string) {
      if (key === '$transaction') return transaction
      return (target as Record<string, unknown>)[key]
    },
  })
  h.state.tx = t.client
  h.getSession.mockResolvedValue(null)
  h.verifyPassword.mockResolvedValue(false)
  h.destroySession.mockResolvedValue(undefined)
  h.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4, resetAt: Date.now() + 60_000 })
})

function mutations(models: Record<string, ModelMock>) {
  const calls: string[] = []
  for (const [model, methods] of Object.entries(models)) {
    for (const [method, fn] of Object.entries(methods)) {
      if (/^(create|update|upsert|delete)/.test(method) && fn.mock.calls.length > 0) {
        calls.push(`${model}.${method}`)
      }
    }
  }
  return calls
}

function deleteRequest(body: unknown = {}) {
  return new NextRequest('http://localhost/api/account', {
    method: 'DELETE',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

const SECRETS = {
  passwordHash: '$2a$12$secret-hash',
  emailVerifyToken: 'verify-token-xyz',
  passwordResetToken: 'reset-token-xyz',
  stripeCustomerId: 'cus_STRIPE123',
  googleId: 'google-id-123',
  appleId: 'apple-id-123',
}

function fullCustomer() {
  return {
    id: ME,
    email: 'ada@example.com',
    firstName: 'Ada',
    lastName: 'Lovelace',
    nickname: 'Amber 4821',
    locale: 'US',
    authProvider: 'email',
    emailVerified: true,
    emailVerifyExpires: new Date(),
    passwordResetExpires: new Date(),
    createdAt: new Date('2026-01-01'),
    ...SECRETS,
    addresses: [{ id: 'a1', customerId: ME, line1: '1 Analytical St', city: 'London', postcode: 'N1', country: 'GB' }],
    orders: [
      {
        id: 'o1',
        customerId: ME,
        reference: 'REF1',
        status: 'DELIVERED',
        totalCents: 4200,
        paymentRef: 'pi_SECRET',
        items: [{ id: 'i1', name: 'Silk Robe', priceCents: 4200, quantity: 1 }],
      },
    ],
    reviews: [{ id: 'r1', customerId: ME, rating: 5, title: 'Lovely', content: 'Great', product: { name: 'Silk Robe' } }],
    sharedWishlists: [{ id: 'w1', customerId: ME, title: 'Mine', productIds: '["p1"]' }],
    alertPreferences: { id: 'ap', customerId: ME, newsletter: false },
    packagingPreference: { id: 'pp', customerId: ME, plainPackaging: true },
    preferences: { id: 'cp', customerId: ME, styleTags: '["romantic"]' },
    couplesLink1: [
      {
        id: 'cl1',
        status: 'active',
        customer2: { firstName: 'Charles', lastName: 'Babbage', nickname: null, email: 'charles@example.com' },
      },
    ],
    couplesLink2: [],
  }
}

describe('GET /api/account/export', () => {
  it('returns 401 when signed out', async () => {
    const { GET } = await import('@/app/api/account/export/route')
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('downloads the member\'s own data without secrets or other people\'s details', async () => {
    h.getSession.mockResolvedValue({ customerId: ME })
    dbModels.customer = { findUnique: vi.fn().mockResolvedValue(fullCustomer()) } as unknown as ModelMock
    const { GET } = await import('@/app/api/account/export/route')
    const res = await GET()
    expect(res.status).toBe(200)
    const disposition = res.headers.get('Content-Disposition') ?? ''
    expect(disposition).toMatch(/^attachment; filename="calo-data-\d{4}-\d{2}-\d{2}\.json"$/)

    const text = await res.text()
    const data = JSON.parse(text)
    expect(data.profile.email).toBe('ada@example.com')
    expect(data.profile.firstName).toBe('Ada')
    expect(data.addresses[0].line1).toBe('1 Analytical St')
    expect(data.orders[0].reference).toBe('REF1')
    expect(data.orders[0].items[0].name).toBe('Silk Robe')
    expect(data.reviews[0].title).toBe('Lovely')
    expect(data.wishlists[0].title).toBe('Mine')
    expect(data.preferences.alerts.newsletter).toBe(false)
    expect(data.preferences.packaging.plainPackaging).toBe(true)
    expect(data.preferences.shopping.styleTags).toBe('["romantic"]')
    expect(data.partnerLinks).toEqual([{ status: 'active', partner: 'Charles B.' }])

    for (const secret of [...Object.values(SECRETS), 'pi_SECRET']) {
      expect(text).not.toContain(secret)
    }
    for (const key of ['passwordHash', 'emailVerifyToken', 'passwordResetToken', 'stripeCustomerId', 'googleId', 'appleId', 'paymentRef']) {
      expect(text).not.toContain(`"${key}"`)
    }
    expect(text).not.toContain('Babbage')
    expect(text).not.toContain('charles@example.com')
  })
})

describe('GET /api/account', () => {
  it('returns 401 when signed out', async () => {
    const { GET } = await import('@/app/api/account/route')
    expect((await GET()).status).toBe(401)
  })

  it('says whether deleting needs a password, without revealing the hash', async () => {
    h.getSession.mockResolvedValue({ customerId: ME })
    dbModels.customer = {
      findUnique: vi.fn().mockResolvedValue({ passwordHash: 'hash' }),
    } as unknown as ModelMock
    const { GET } = await import('@/app/api/account/route')
    const res = await GET()
    const text = await res.text()
    expect(JSON.parse(text)).toEqual({ hasPassword: true })
    expect(text).not.toContain('hash"')
  })
})

describe('DELETE /api/account', () => {
  function signedInAs(customer: Record<string, unknown>) {
    h.getSession.mockResolvedValue({ customerId: ME })
    dbModels.customer = {
      findUnique: vi.fn().mockResolvedValue({ id: ME, passwordHash: null, ...customer }),
    } as unknown as ModelMock
  }

  it('returns 401 when signed out', async () => {
    const { DELETE } = await import('@/app/api/account/route')
    const res = await DELETE(deleteRequest({ password: 'x' }))
    expect(res.status).toBe(401)
    expect(transaction).not.toHaveBeenCalled()
  })

  it('refuses an email account with the wrong password and changes nothing', async () => {
    signedInAs({ passwordHash: 'hash' })
    h.verifyPassword.mockResolvedValue(false)
    const { DELETE } = await import('@/app/api/account/route')
    const res = await DELETE(deleteRequest({ password: 'wrong' }))
    expect(res.status).toBe(403)
    expect(h.verifyPassword).toHaveBeenCalledWith('wrong', 'hash')
    expect(transaction).not.toHaveBeenCalled()
    expect(mutations(txModels)).toEqual([])
    expect(mutations(dbModels)).toEqual([])
    expect(h.destroySession).not.toHaveBeenCalled()
  })

  it('refuses an email account with no password supplied', async () => {
    signedInAs({ passwordHash: 'hash' })
    const { DELETE } = await import('@/app/api/account/route')
    const res = await DELETE(deleteRequest({}))
    expect(res.status).toBe(403)
    expect(transaction).not.toHaveBeenCalled()
  })

  it.each(['PENDING', 'PAYMENT_RECEIVED', 'PROCESSING', 'SHIPPED'])(
    'refuses with 409 while an order is %s and changes nothing',
    async (status) => {
      signedInAs({ passwordHash: 'hash' })
      h.verifyPassword.mockResolvedValue(true)
      const { DELETE } = await import('@/app/api/account/route')
      // The in-progress check runs inside the transaction, before any write
      const orderCount = vi.fn(async ({ where }: { where: { customerId: string; status: { in: string[] } } }) =>
        where.customerId === ME && where.status.in.includes(status) ? 1 : 0
      )
      txModels.order = { count: orderCount } as unknown as ModelMock
      const res = await DELETE(deleteRequest({ password: 'right' }))
      expect(res.status).toBe(409)
      const body = await res.json()
      expect(body.error).toMatch(/^You have an order in progress/)
      expect(mutations(txModels)).toEqual([])
      expect(h.destroySession).not.toHaveBeenCalled()
    }
  )

  it('refuses with 409 for a host with streams', async () => {
    signedInAs({})
    const { DELETE } = await import('@/app/api/account/route')
    txModels.streamHost = {
      findUnique: vi.fn().mockResolvedValue({ id: 'h1', _count: { streams: 2 } }),
    } as unknown as ModelMock
    const res = await DELETE(deleteRequest({}))
    expect(res.status).toBe(409)
    expect((await res.json()).error).toBe('Contact support to close a host account')
    expect(mutations(txModels)).toEqual([])
  })

  it('refuses with 409 while a subscription is active and changes nothing', async () => {
    signedInAs({})
    const { DELETE } = await import('@/app/api/account/route')
    txModels.subscription = {
      count: vi.fn(async ({ where }: { where: { customerId: string; status: { in: string[] } } }) =>
        where.customerId === ME && where.status.in.includes('active') ? 1 : 0
      ),
    } as unknown as ModelMock
    const res = await DELETE(deleteRequest({}))
    expect(res.status).toBe(409)
    expect((await res.json()).error).toMatch(/active subscription/)
    expect(mutations(txModels)).toEqual([])
    expect(h.destroySession).not.toHaveBeenCalled()
  })

  it('rate-limits password attempts with 429 and changes nothing', async () => {
    signedInAs({ passwordHash: 'hash' })
    h.checkRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 })
    const { DELETE } = await import('@/app/api/account/route')
    const res = await DELETE(deleteRequest({ password: 'guess' }))
    expect(res.status).toBe(429)
    expect(h.checkRateLimit).toHaveBeenCalledWith(`account:delete:${ME}`, { windowMs: 60_000, maxRequests: 5 })
    expect(h.verifyPassword).not.toHaveBeenCalled()
    expect(transaction).not.toHaveBeenCalled()
  })

  it('deletes personal data and anonymises the rest in one transaction', async () => {
    signedInAs({ passwordHash: 'hash' })
    h.verifyPassword.mockResolvedValue(true)
    const { DELETE } = await import('@/app/api/account/route')
    // Make sure the tx models exist before the call so we can override
    const tx = h.state.tx as Record<string, ModelMock>
    tx.address.findMany.mockResolvedValue([{ id: 'a-used' }])

    const res = await DELETE(deleteRequest({ password: 'right' }))
    expect(res.status).toBe(200)
    expect(transaction).toHaveBeenCalledTimes(1)

    // Personal rows deleted
    expect(tx.session.deleteMany).toHaveBeenCalledWith({ where: { customerId: ME } })
    expect(tx.priceDropAlert.deleteMany).toHaveBeenCalledWith({ where: { customerId: ME } })
    expect(tx.stockAlert.deleteMany).toHaveBeenCalledWith({ where: { customerId: ME } })
    expect(tx.sharedWishlist.deleteMany).toHaveBeenCalledWith({ where: { customerId: ME } })
    expect(tx.giftRegistry.deleteMany).toHaveBeenCalledWith({ where: { customerId: ME } })
    expect(tx.packagingPreference.deleteMany).toHaveBeenCalledWith({ where: { customerId: ME } })
    expect(tx.couplesLink.deleteMany).toHaveBeenCalledWith({
      where: { OR: [{ customer1Id: ME }, { customer2Id: ME }] },
    })

    // Addresses: unreferenced deleted, referenced anonymised (country kept)
    expect(tx.address.deleteMany).toHaveBeenCalledWith({
      where: { customerId: ME, id: { notIn: ['a-used'] } },
    })
    expect(tx.address.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['a-used'] } },
      data: { line1: 'Deleted', line2: null, city: 'Deleted', state: null, postcode: 'Deleted', isDefault: false },
    })

    // No trace of the member's email on records kept for others
    const placeholder = `deleted+${ME}@invalid`
    expect(tx.referral.updateMany).toHaveBeenCalledWith({
      where: { referredCustomerId: ME },
      data: { referredEmail: placeholder, referredCustomerId: null },
    })
    expect(tx.giftCard.updateMany).toHaveBeenCalledWith({
      where: { redeemedById: ME },
      data: { recipientEmail: placeholder, recipientName: null, redeemedById: null },
    })
    expect(tx.productView.deleteMany).toHaveBeenCalledWith({ where: { customerId: ME } })
    expect(tx.checkoutSession.deleteMany).toHaveBeenCalledWith({ where: { customerId: ME } })

    // Reviews kept but detached
    expect(tx.review.updateMany).toHaveBeenCalledWith({
      where: { customerId: ME },
      data: { customerId: null, guestName: 'Deleted member', guestEmail: null },
    })

    // Customer anonymised
    const update = tx.customer.update.mock.calls[0][0]
    expect(update.where).toEqual({ id: ME })
    expect(update.data).toMatchObject({
      email: `deleted+${ME}@invalid`,
      firstName: 'Deleted',
      lastName: '',
      nickname: null,
      passwordHash: null,
      googleId: null,
      appleId: null,
      googleEmail: null,
      appleEmail: null,
      emailVerified: false,
      stripeCustomerId: null,
    })

    expect(h.destroySession).toHaveBeenCalledTimes(1)
    // The cookie is cleared only after the transaction has committed
    expect(h.destroySession.mock.invocationCallOrder[0]).toBeGreaterThan(transaction.mock.invocationCallOrder[0])
  })

  it('lets an OAuth-only account delete without a password', async () => {
    signedInAs({ passwordHash: null, authProvider: 'google' })
    const { DELETE } = await import('@/app/api/account/route')
    const res = await DELETE(deleteRequest({}))
    expect(res.status).toBe(200)
    expect(h.verifyPassword).not.toHaveBeenCalled()
    expect(transaction).toHaveBeenCalledTimes(1)
    expect(h.destroySession).toHaveBeenCalledTimes(1)
  })
})
