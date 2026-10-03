// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { db, getSession } = vi.hoisted(() => ({
  db: { customer: { findUnique: vi.fn() } },
  getSession: vi.fn(),
}))

vi.mock('@/lib/db', () => ({ db }))
vi.mock('@/lib/auth/session', () => ({ getSession }))

import { GET } from '@/app/api/realtime/token/route'
import { verifyRealtimeToken } from '../../../mini-services/realtime-token'

const secret = 'test-realtime-secret-at-least-32-chars'

beforeEach(() => {
  vi.clearAllMocks()
  process.env.REALTIME_TOKEN_SECRET = secret
})

afterEach(() => {
  delete process.env.REALTIME_TOKEN_SECRET
})

describe('GET /api/realtime/token', () => {
  it('returns a null token for an anonymous visitor', async () => {
    getSession.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ token: null })
    expect(db.customer.findUnique).not.toHaveBeenCalled()
  })

  it('returns a null token when the secret is not configured', async () => {
    delete process.env.REALTIME_TOKEN_SECRET
    getSession.mockResolvedValue({ customerId: 'c1', email: 'a@b.co' })
    expect(await (await GET()).json()).toEqual({ token: null })
  })

  it('describes the signed-in customer from the database, not from the request', async () => {
    getSession.mockResolvedValue({ customerId: 'c1', email: 'a@b.co' })
    db.customer.findUnique.mockResolvedValue({ id: 'c1', isAdmin: true, hostProfile: { id: 'h1' } })

    const { token } = await (await GET()).json()
    expect(await verifyRealtimeToken(token, secret)).toEqual({ customerId: 'c1', isAdmin: true, hostId: 'h1' })
  })

  it('issues a non-admin, non-host token for a plain customer', async () => {
    getSession.mockResolvedValue({ customerId: 'c2', email: 'c@d.co' })
    db.customer.findUnique.mockResolvedValue({ id: 'c2', isAdmin: false, hostProfile: null })

    const { token } = await (await GET()).json()
    expect(await verifyRealtimeToken(token, secret)).toEqual({ customerId: 'c2', isAdmin: false, hostId: null })
  })
})
