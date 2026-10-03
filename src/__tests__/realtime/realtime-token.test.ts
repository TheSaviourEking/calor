// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { SignJWT } from 'jose'
import { signRealtimeToken, verifyRealtimeToken } from '../../../mini-services/realtime-token'

const secret = 'test-realtime-secret-at-least-32-chars'
const user = { customerId: 'c1', isAdmin: true, hostId: 'h1' }

describe('realtime token', () => {
  it('round-trips the user', async () => {
    const token = await signRealtimeToken(user, secret)
    expect(await verifyRealtimeToken(token, secret)).toEqual(user)
  })

  it('keeps a null hostId and a false isAdmin', async () => {
    const plain = { customerId: 'c2', isAdmin: false, hostId: null }
    expect(await verifyRealtimeToken(await signRealtimeToken(plain, secret), secret)).toEqual(plain)
  })

  it('returns null for a token signed with another secret', async () => {
    const token = await signRealtimeToken(user, 'a-completely-different-secret-value!!')
    expect(await verifyRealtimeToken(token, secret)).toBeNull()
  })

  it('returns null for an expired token', async () => {
    const token = await signRealtimeToken(user, secret, -10)
    expect(await verifyRealtimeToken(token, secret)).toBeNull()
  })

  it('returns null for a token with the right secret but the wrong audience', async () => {
    const token = await new SignJWT({ customerId: 'c1', isAdmin: true, hostId: null })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer('calor-web')
      .setAudience('something-else')
      .setExpirationTime('5m')
      .sign(new TextEncoder().encode(secret))
    expect(await verifyRealtimeToken(token, secret)).toBeNull()
  })

  it('returns null for a missing token, a non-string token, garbage, or a missing secret', async () => {
    expect(await verifyRealtimeToken(undefined, secret)).toBeNull()
    expect(await verifyRealtimeToken({ token: 'x' }, secret)).toBeNull()
    expect(await verifyRealtimeToken('not-a-jwt', secret)).toBeNull()
    expect(await verifyRealtimeToken(await signRealtimeToken(user, secret), undefined)).toBeNull()
    expect(await verifyRealtimeToken(await signRealtimeToken(user, secret), '')).toBeNull()
  })

  it('never treats a truthy non-boolean isAdmin claim as admin', async () => {
    const token = await new SignJWT({ customerId: 'c1', isAdmin: 'yes', hostId: 7 })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer('calor-web')
      .setAudience('calor-realtime')
      .setExpirationTime('5m')
      .sign(new TextEncoder().encode(secret))
    expect(await verifyRealtimeToken(token, secret)).toEqual({ customerId: 'c1', isAdmin: false, hostId: null })
  })
})
