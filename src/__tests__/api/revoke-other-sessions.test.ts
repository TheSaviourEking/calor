// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { db, getSession, cookieGet } = vi.hoisted(() => ({
  db: { session: { deleteMany: vi.fn() }, customer: { findUnique: vi.fn() } },
  getSession: vi.fn(),
  cookieGet: vi.fn(),
}))

vi.mock('@/lib/db', () => ({ db }))
vi.mock('@/lib/auth/session', () => ({ getSession }))
vi.mock('next/headers', () => ({ cookies: async () => ({ get: cookieGet }) }))

import { POST } from '@/app/api/sessions/revoke-others/route'

beforeEach(() => {
  vi.clearAllMocks()
  getSession.mockResolvedValue({ customerId: 'c1', email: 'a@b.c' })
  cookieGet.mockReturnValue({ value: 'tok_current' })
  db.session.deleteMany.mockResolvedValue({ count: 2 })
})

describe('POST /api/sessions/revoke-others', () => {
  it('401s without a session', async () => {
    getSession.mockResolvedValue(null)
    const res = await POST()
    expect(res.status).toBe(401)
    expect(db.session.deleteMany).not.toHaveBeenCalled()
  })

  it('deletes the customer\'s other sessions and keeps the current one', async () => {
    const res = await POST()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ revoked: 2 })
    expect(db.session.deleteMany).toHaveBeenCalledWith({
      where: { customerId: 'c1', token: { not: 'tok_current' } },
    })
  })
})
