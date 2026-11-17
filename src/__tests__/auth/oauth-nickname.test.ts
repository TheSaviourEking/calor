// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  jwtVerify: vi.fn(),
  db: { customer: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), create: vi.fn() } },
}))

vi.mock('@/lib/db', () => ({ db: mocks.db }))
vi.mock('@/lib/auth/session', () => ({ createSession: vi.fn() }))
vi.mock('@/lib/config', () => ({ config: { app: { baseUrl: 'https://calo.one' } } }))
vi.mock('jose', () => ({
  jwtVerify: mocks.jwtVerify,
  createRemoteJWKSet: vi.fn(() => 'jwks'),
  importPKCS8: vi.fn(),
  SignJWT: class {},
}))

import { GET as googleGet } from '@/app/api/auth/oauth/google/route'
import { POST as applePost } from '@/app/api/auth/oauth/apple/route'

const FORMAT = /^[A-Z][a-z]+ \d{4}$/

function googleReq() {
  return new NextRequest('https://calo.one/api/auth/oauth/google?code=c&state=s', {
    headers: { cookie: 'oauth_state=s' },
  })
}
function appleReq() {
  return new NextRequest('https://calo.one/api/auth/oauth/apple', {
    method: 'POST',
    body: new URLSearchParams({ id_token: 't', state: 's' }),
    headers: { cookie: 'oauth_state=s' },
  })
}

beforeEach(() => {
  vi.resetAllMocks()
  process.env.APPLE_CLIENT_ID = 'one.calo.web'
  mocks.db.customer.findFirst.mockResolvedValue(null)
  mocks.db.customer.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'n', email: 'a@b.com', ...data }))
  mocks.db.customer.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'e', email: 'a@b.com', ...data }))
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => ({
      json: async () =>
        String(url).includes('token')
          ? { access_token: 'tok' }
          : { id: 'g1', email: 'a@b.com', name: 'Ada Lovelace' },
    })),
  )
  mocks.jwtVerify.mockResolvedValue({ payload: { sub: 'ap1', email: 'a@b.com', email_verified: true } })
})

describe('Google OAuth nickname', () => {
  it('sets a generated nickname when creating a new customer', async () => {
    mocks.db.customer.findUnique.mockResolvedValue(null)
    await googleGet(googleReq())
    expect(mocks.db.customer.create.mock.calls[0][0].data.nickname).toMatch(FORMAT)
  })
  it('does not touch the nickname when linking an existing customer', async () => {
    mocks.db.customer.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'e', email: 'a@b.com' })
    await googleGet(googleReq())
    expect(mocks.db.customer.update).toHaveBeenCalledTimes(1)
    expect(mocks.db.customer.update.mock.calls[0][0].data).not.toHaveProperty('nickname')
    expect(mocks.db.customer.create).not.toHaveBeenCalled()
  })
})

describe('Apple OAuth nickname', () => {
  it('sets a generated nickname when creating a new customer', async () => {
    mocks.db.customer.findUnique.mockResolvedValue(null)
    await applePost(appleReq())
    expect(mocks.db.customer.create.mock.calls[0][0].data.nickname).toMatch(FORMAT)
  })
  it('does not touch the nickname when linking an existing customer', async () => {
    mocks.db.customer.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'e', email: 'a@b.com' })
    await applePost(appleReq())
    expect(mocks.db.customer.update).toHaveBeenCalledTimes(1)
    expect(mocks.db.customer.update.mock.calls[0][0].data).not.toHaveProperty('nickname')
    expect(mocks.db.customer.create).not.toHaveBeenCalled()
  })
})
