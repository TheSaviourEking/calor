// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { db, getSession } = vi.hoisted(() => ({
  db: {
    customer: { findUnique: vi.fn() },
    streamHost: { findUnique: vi.fn() },
    liveStream: { findUnique: vi.fn() },
  },
  getSession: vi.fn(),
}))

vi.mock('@/lib/db', () => ({ db }))
vi.mock('@/lib/auth/session', () => ({ getSession }))

import { requireCustomer, requireAdminUser, requireHostProfile, requireStreamOwner } from '@/lib/auth/guards'
import { isAuthorizedCron } from '@/lib/cron'

function statusOf(result: { ok: boolean; response?: Response }) {
  return result.ok ? 200 : result.response!.status
}

beforeEach(() => {
  vi.clearAllMocks()
  getSession.mockResolvedValue(null)
})

describe('requireCustomer', () => {
  it('returns 401 without a session and never reads the database', async () => {
    expect(statusOf(await requireCustomer())).toBe(401)
    expect(db.customer.findUnique).not.toHaveBeenCalled()
  })

  it('returns the session customer id', async () => {
    getSession.mockResolvedValue({ customerId: 'c1', email: 'a@b.co' })
    expect(await requireCustomer()).toEqual({ ok: true, customerId: 'c1' })
  })
})

describe('requireAdminUser', () => {
  it('returns 401 without a session', async () => {
    expect(statusOf(await requireAdminUser())).toBe(401)
  })

  it('returns 403 for a signed-in non-admin', async () => {
    getSession.mockResolvedValue({ customerId: 'c1', email: 'a@b.co' })
    db.customer.findUnique.mockResolvedValue({ isAdmin: false, isHost: true })
    expect(statusOf(await requireAdminUser())).toBe(403)
  })

  it('passes an admin', async () => {
    getSession.mockResolvedValue({ customerId: 'c1', email: 'a@b.co' })
    db.customer.findUnique.mockResolvedValue({ isAdmin: true, isHost: false })
    expect(await requireAdminUser()).toEqual({ ok: true, customerId: 'c1' })
  })
})

describe('requireHostProfile', () => {
  it('returns 403 for a customer who is neither host nor admin', async () => {
    getSession.mockResolvedValue({ customerId: 'c1', email: 'a@b.co' })
    db.customer.findUnique.mockResolvedValue({ isAdmin: false, isHost: false })
    expect(statusOf(await requireHostProfile())).toBe(403)
  })

  it('returns the host profile id for a host', async () => {
    getSession.mockResolvedValue({ customerId: 'c1', email: 'a@b.co' })
    db.customer.findUnique.mockResolvedValue({ isAdmin: false, isHost: true })
    db.streamHost.findUnique.mockResolvedValue({ id: 'h1' })
    expect(await requireHostProfile()).toEqual({ ok: true, customerId: 'c1', isAdmin: false, hostId: 'h1' })
  })

  it('passes an admin who has no host profile, with hostId null', async () => {
    getSession.mockResolvedValue({ customerId: 'c1', email: 'a@b.co' })
    db.customer.findUnique.mockResolvedValue({ isAdmin: true, isHost: false })
    db.streamHost.findUnique.mockResolvedValue(null)
    expect(await requireHostProfile()).toEqual({ ok: true, customerId: 'c1', isAdmin: true, hostId: null })
  })
})

describe('requireStreamOwner', () => {
  beforeEach(() => {
    getSession.mockResolvedValue({ customerId: 'c1', email: 'a@b.co' })
    db.customer.findUnique.mockResolvedValue({ isAdmin: false, isHost: true })
  })

  it('returns 401 without a session', async () => {
    getSession.mockResolvedValue(null)
    expect(statusOf(await requireStreamOwner('s1'))).toBe(401)
    expect(db.liveStream.findUnique).not.toHaveBeenCalled()
  })

  it('returns 404 for a stream that does not exist', async () => {
    db.liveStream.findUnique.mockResolvedValue(null)
    expect(statusOf(await requireStreamOwner('s1'))).toBe(404)
  })

  it('returns 403 when the stream belongs to another host', async () => {
    db.liveStream.findUnique.mockResolvedValue({ host: { customerId: 'someone-else' } })
    expect(statusOf(await requireStreamOwner('s1'))).toBe(403)
  })

  it('passes the owning host', async () => {
    db.liveStream.findUnique.mockResolvedValue({ host: { customerId: 'c1' } })
    expect(await requireStreamOwner('s1')).toEqual({ ok: true, customerId: 'c1', isAdmin: false })
  })

  it('passes an admin for any stream', async () => {
    db.customer.findUnique.mockResolvedValue({ isAdmin: true, isHost: false })
    db.liveStream.findUnique.mockResolvedValue({ host: { customerId: 'someone-else' } })
    expect(await requireStreamOwner('s1')).toEqual({ ok: true, customerId: 'c1', isAdmin: true })
  })
})

describe('isAuthorizedCron', () => {
  const request = (auth?: string) =>
    new Request('http://localhost/api/cron/x', { method: 'POST', headers: auth ? { authorization: auth } : {} })

  afterEach(() => {
    delete process.env.CRON_SECRET
  })

  it('refuses everything when CRON_SECRET is not set', () => {
    expect(isAuthorizedCron(request())).toBe(false)
    expect(isAuthorizedCron(request('Bearer '))).toBe(false)
    expect(isAuthorizedCron(request('Bearer undefined'))).toBe(false)
  })

  it('accepts only the exact bearer secret', () => {
    process.env.CRON_SECRET = 's3cret'
    expect(isAuthorizedCron(request('Bearer s3cret'))).toBe(true)
    expect(isAuthorizedCron(request('Bearer wrong'))).toBe(false)
    expect(isAuthorizedCron(request())).toBe(false)
  })

  it('refuses lowercase bearer prefix', () => {
    process.env.CRON_SECRET = 's3cret'
    expect(isAuthorizedCron(request('bearer s3cret'))).toBe(false)
  })

  it('refuses bearer secret with trailing space', () => {
    process.env.CRON_SECRET = 's3cret'
    expect(isAuthorizedCron(request('Bearer s3cret '))).toBe(false)
  })
})
