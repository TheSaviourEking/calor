// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  jwtVerify: vi.fn(),
  createSession: vi.fn(),
  db: { customer: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn() } },
}))

vi.mock('@/lib/db', () => ({ db: mocks.db }))
vi.mock('@/lib/auth/session', () => ({ createSession: mocks.createSession }))
vi.mock('@/lib/config', () => ({ config: { app: { baseUrl: 'https://calo.one' } } }))
vi.mock('jose', () => ({
  jwtVerify: mocks.jwtVerify,
  createRemoteJWKSet: vi.fn(() => 'apple-jwks'),
  importPKCS8: vi.fn(async () => 'private-key'),
  SignJWT: class {
    setProtectedHeader() { return this }
    setIssuedAt() { return this }
    setExpirationTime() { return this }
    setIssuer() { return this }
    setAudience() { return this }
    setSubject() { return this }
    async sign() { return 'client-secret' }
  },
}))

import { GET, POST } from '@/app/api/auth/oauth/apple/route'

function callback(fields: Record<string, string>, cookie?: string) {
  const body = new URLSearchParams(fields)
  return new NextRequest('https://calo.one/api/auth/oauth/apple', {
    method: 'POST',
    body,
    headers: cookie ? { cookie } : {},
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.APPLE_CLIENT_ID = 'one.calo.web'
  process.env.APPLE_TEAM_ID = 'TEAM123'
  process.env.APPLE_KEY_ID = 'KEY123'
  process.env.APPLE_PRIVATE_KEY = 'pk'
})

describe('Apple OAuth', () => {
  it('sets the state cookie SameSite=None and Secure so the form_post callback carries it', async () => {
    const response = await GET(new NextRequest('https://calo.one/api/auth/oauth/apple'))
    const setCookie = response.headers.get('set-cookie') ?? ''
    expect(setCookie).toMatch(/oauth_state=/)
    expect(setCookie).toMatch(/samesite=none/i)
    expect(setCookie).toMatch(/;\s*secure/i)
  })

  it('redirects with 303 and invalid_state when the state cookie is missing or mismatched', async () => {
    const missing = await POST(callback({ id_token: 't', state: 'abc' }))
    expect(missing.status).toBe(303)
    expect(missing.headers.get('location')).toContain('error=invalid_state')

    const mismatched = await POST(callback({ id_token: 't', state: 'abc' }, 'oauth_state=other'))
    expect(mismatched.status).toBe(303)
    expect(mismatched.headers.get('location')).toContain('error=invalid_state')
  })

  it('verifies the id token with RS256, Apple as issuer and our client id as audience', async () => {
    mocks.jwtVerify.mockRejectedValue(new Error('bad token'))
    const response = await POST(callback({ id_token: 't', state: 'abc' }, 'oauth_state=abc'))

    expect(mocks.jwtVerify).toHaveBeenCalledTimes(1)
    const options = mocks.jwtVerify.mock.calls[0][2]
    expect(options).toMatchObject({
      algorithms: ['RS256'],
      issuer: 'https://appleid.apple.com',
      audience: 'one.calo.web',
    })
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toContain('error=oauth_failed')
  })
})
