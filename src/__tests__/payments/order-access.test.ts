import { describe, it, expect } from 'vitest'
import { canAccessOrder } from '@/lib/orders/access'

describe('canAccessOrder', () => {
  const customerOrder = { customerId: 'cust_1', guestEmail: null }
  const guestOrder = { customerId: null, guestEmail: 'Guest@Example.com' }

  it('lets the owning customer in', () => {
    expect(canAccessOrder(customerOrder, { customerId: 'cust_1' })).toBe(true)
  })

  it('keeps other customers and anonymous callers out of a customer order', () => {
    expect(canAccessOrder(customerOrder, { customerId: 'cust_2' })).toBe(false)
    expect(canAccessOrder(customerOrder, {})).toBe(false)
    expect(canAccessOrder(customerOrder, { guestEmail: 'guest@example.com' })).toBe(false)
  })

  it('matches a guest order by email, ignoring case and surrounding spaces', () => {
    expect(canAccessOrder(guestOrder, { guestEmail: ' guest@example.com ' })).toBe(true)
  })

  it('keeps a guest order closed to a wrong or missing email, even with a session', () => {
    expect(canAccessOrder(guestOrder, { guestEmail: 'other@example.com' })).toBe(false)
    expect(canAccessOrder(guestOrder, { customerId: 'cust_1' })).toBe(false)
    expect(canAccessOrder({ customerId: null, guestEmail: null }, { guestEmail: '' })).toBe(false)
  })
})
