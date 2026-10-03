import { describe, it, expect } from 'vitest'
import { isAdmin, canControlStream, cleanMessage } from '../../../mini-services/authz'

const admin = { customerId: 'a', isAdmin: true, hostId: null }
const host = { customerId: 'h', isAdmin: false, hostId: 'host_1' }
const customer = { customerId: 'c', isAdmin: false, hostId: null }

describe('isAdmin', () => {
  it('is true only for an admin user', () => {
    expect(isAdmin(admin)).toBe(true)
    expect(isAdmin(host)).toBe(false)
    expect(isAdmin(customer)).toBe(false)
    expect(isAdmin(null)).toBe(false)
    expect(isAdmin(undefined)).toBe(false)
  })
})

describe('canControlStream', () => {
  const stream = { hostId: 'host_1' }

  it('allows the stream\'s own host and any admin', () => {
    expect(canControlStream(host, stream)).toBe(true)
    expect(canControlStream(admin, stream)).toBe(true)
  })

  it('refuses another host, a plain customer, an anonymous socket and a missing stream', () => {
    expect(canControlStream({ ...host, hostId: 'host_2' }, stream)).toBe(false)
    expect(canControlStream(customer, stream)).toBe(false)
    expect(canControlStream(null, stream)).toBe(false)
    expect(canControlStream(host, null)).toBe(false)
  })
})

describe('cleanMessage', () => {
  it('trims and returns a normal message', () => {
    expect(cleanMessage('  hello  ', 500)).toBe('hello')
  })

  it('truncates to the limit', () => {
    expect(cleanMessage('x'.repeat(100_000), 500)).toHaveLength(500)
  })

  it('rejects empty, whitespace-only and non-string input', () => {
    expect(cleanMessage('', 500)).toBeNull()
    expect(cleanMessage('   ', 500)).toBeNull()
    expect(cleanMessage(undefined, 500)).toBeNull()
    expect(cleanMessage({ text: 'hi' }, 500)).toBeNull()
    expect(cleanMessage(42, 500)).toBeNull()
  })
})
