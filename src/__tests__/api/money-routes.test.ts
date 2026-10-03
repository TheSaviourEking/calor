// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { db, getSession, sendAbandonedCartEmail } = vi.hoisted(() => ({
  db: {
    customer: { findUnique: vi.fn() },
    abandonedCart: { findUnique: vi.fn(), update: vi.fn() },
    promotion: { create: vi.fn() },
  },
  getSession: vi.fn(),
  sendAbandonedCartEmail: vi.fn(),
}))

vi.mock('@/lib/db', () => ({ db }))
vi.mock('@/lib/auth/session', () => ({ getSession }))
vi.mock('@/lib/email', () => ({ sendAbandonedCartEmail }))

beforeEach(() => {
  vi.clearAllMocks()
  getSession.mockResolvedValue({ customerId: 'admin-1', email: 'admin@example.com' })
  db.customer.findUnique.mockResolvedValue({ isAdmin: true, isHost: false })
  db.abandonedCart.findUnique.mockResolvedValue({
    id: 'cart-1',
    email: 'shopper@example.com',
    customer: null,
    cartData: JSON.stringify({ items: [] }),
    recoveryEmailsSent: 0,
  })
  db.abandonedCart.update.mockResolvedValue({})
  db.promotion.create.mockImplementation(async ({ data }: { data: unknown }) => data)
  sendAbandonedCartEmail.mockResolvedValue({ success: true })
})

async function recover(discountPercent: unknown) {
  const { POST } = await import('@/app/api/abandoned-cart/recover/route')
  const request = new NextRequest('http://localhost/api/abandoned-cart/recover', {
    method: 'POST',
    body: JSON.stringify({ cartId: 'cart-1', discountPercent }),
  })
  return POST(request)
}

describe('POST /api/abandoned-cart/recover discount', () => {
  it.each([
    [100, 20],
    [1, 5],
    [-50, 5],
    [12.7, 12],
    ['abc', 10],
  ])('clamps %s to %s percent', async (input, expected) => {
    const res = await recover(input)
    expect(res.status).toBe(200)
    expect(db.promotion.create.mock.calls[0][0].data.value).toBe(expected)
    expect(sendAbandonedCartEmail.mock.calls[0][0].discountPercent).toBe(expected)
  })
})
