// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { db, getSession } = vi.hoisted(() => ({
  db: { customer: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), create: vi.fn() } },
  getSession: vi.fn(),
}))
vi.mock('@/lib/db', () => ({ db }))
vi.mock('@/lib/auth/session', () => ({
  getSession,
  hashPassword: vi.fn(async () => 'hash'),
  createSession: vi.fn(),
}))
vi.mock('@/lib/email', () => ({ sendVerificationEmail: vi.fn(), sendSecurityAlert: vi.fn() }))
vi.mock('@/lib/geo', () => ({
  getGeoInfo: vi.fn(async () => ({ ip: '1.1.1.1' })),
  parseUserAgent: vi.fn(() => 'device'),
  formatLocation: vi.fn(() => 'loc'),
}))
vi.mock('@/lib/rate-limit', () => ({ rateLimitByIp: vi.fn(async () => ({ allowed: true, resetAt: 0 })) }))

import { GET, PUT } from '@/app/api/account/nickname/route'
import { POST as register } from '@/app/api/auth/register/route'
import { uniqueGeneratedNickname } from '@/lib/nickname'

function put(body: unknown) {
  return new Request('http://x/api/account/nickname', {
    method: 'PUT',
    body: JSON.stringify(body),
  }) as never
}

beforeEach(() => {
  vi.resetAllMocks()
  getSession.mockResolvedValue({ customerId: 'me' })
  db.customer.findFirst.mockResolvedValue(null)
})

describe('PUT /api/account/nickname', () => {
  it('401 when unauthenticated', async () => {
    getSession.mockResolvedValue(null)
    const res = await PUT(put({ nickname: 'Night Owl' }))
    expect(res.status).toBe(401)
  })

  it('400 with the validator error for an invalid nickname', async () => {
    const res = await PUT(put({ nickname: 'a@b.com' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('Nickname cannot contain @')
  })

  it('409 when someone else has it, case-insensitively', async () => {
    db.customer.findFirst.mockResolvedValue({ id: 'other' })
    const res = await PUT(put({ nickname: 'amber 4821' }))
    expect(res.status).toBe(409)
    expect(db.customer.findFirst.mock.calls[0][0].where.nickname).toEqual({
      equals: 'amber 4821',
      mode: 'insensitive',
    })
    expect(db.customer.update).not.toHaveBeenCalled()
  })

  it('200 when the match is the caller (own nickname, different case)', async () => {
    db.customer.findFirst.mockResolvedValue({ id: 'me' })
    db.customer.update.mockResolvedValue({ nickname: 'amber 4821' })
    const res = await PUT(put({ nickname: 'amber 4821' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ nickname: 'amber 4821' })
  })

  it('updates and returns the nickname', async () => {
    db.customer.update.mockResolvedValue({ nickname: 'Night Owl' })
    const res = await PUT(put({ nickname: '  Night  Owl ' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ nickname: 'Night Owl' })
    expect(db.customer.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'me' }, data: { nickname: 'Night Owl' } }),
    )
  })

  it('409 rather than 500 on a unique-constraint race', async () => {
    db.customer.update.mockRejectedValue(Object.assign(new Error('dup'), { code: 'P2002' }))
    const res = await PUT(put({ nickname: 'Night Owl' }))
    expect(res.status).toBe(409)
  })
})

describe('GET /api/account/nickname', () => {
  it('401 when unauthenticated', async () => {
    getSession.mockResolvedValue(null)
    expect((await GET()).status).toBe(401)
  })

  it('returns the current nickname', async () => {
    db.customer.findUnique.mockResolvedValue({ nickname: 'Amber 4821' })
    expect(await (await GET()).json()).toEqual({ nickname: 'Amber 4821' })
  })

  it('returns null for existing customers without one', async () => {
    db.customer.findUnique.mockResolvedValue({ nickname: null })
    expect(await (await GET()).json()).toEqual({ nickname: null })
  })
})

describe('uniqueGeneratedNickname', () => {
  it('retries on collision and returns a free one', async () => {
    db.customer.findFirst.mockResolvedValueOnce({ id: 'x' }).mockResolvedValueOnce({ id: 'x' }).mockResolvedValue(null)
    const n = await uniqueGeneratedNickname()
    expect(n).toMatch(/^[A-Z][a-z]+ \d{4}$/)
    expect(db.customer.findFirst).toHaveBeenCalledTimes(3)
  })

  it('after 5 collisions appends a 6th digit and does not throw', async () => {
    db.customer.findFirst.mockResolvedValue({ id: 'x' })
    const n = await uniqueGeneratedNickname()
    expect(n).toMatch(/^[A-Z][a-z]+ \d{5}$/)
    expect(db.customer.findFirst).toHaveBeenCalledTimes(5)
  })
})

describe('registration', () => {
  it('creates the customer with a generated nickname', async () => {
    db.customer.findUnique.mockResolvedValue(null)
    db.customer.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'c1',
      ...data,
    }))
    const res = await register(
      new Request('http://x/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'a@b.com',
          password: 'Test123!@',
          firstName: 'Ada',
          lastName: 'Lovelace',
        }),
      }) as never,
    )
    expect(res.status).toBe(200)
    expect(db.customer.create.mock.calls[0][0].data.nickname).toMatch(/^[A-Z][a-z]+ \d{4}$/)
  })
})
