// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { db, tx, getSession, sendOrderConfirmationFor } = vi.hoisted(() => {
  const tx = {
    address: { create: vi.fn() },
    variant: { updateMany: vi.fn() },
    product: { update: vi.fn(), updateMany: vi.fn() },
    promotion: { updateMany: vi.fn() },
    giftCard: { updateMany: vi.fn() },
    giftCardTransaction: { create: vi.fn() },
    loyaltyAccount: { updateMany: vi.fn() },
    loyaltyTransaction: { create: vi.fn() },
    order: { create: vi.fn() },
  }
  const db = {
    customer: { findUnique: vi.fn() },
    product: { findMany: vi.fn() },
    promotion: { findUnique: vi.fn() },
    giftCard: { findUnique: vi.fn() },
    loyaltyAccount: { findUnique: vi.fn() },
    giftWrappingOption: { findFirst: vi.fn() },
    address: { findFirst: vi.fn() },
    $transaction: vi.fn(),
  }
  return { db, tx, getSession: vi.fn(), sendOrderConfirmationFor: vi.fn() }
})

vi.mock('@/lib/db', () => ({ db }))
vi.mock('@/lib/auth', () => ({ getSession }))
vi.mock('@/lib/orders/lifecycle', () => ({ sendOrderConfirmationFor }))

import { POST } from '@/app/api/orders/route'

const product = {
  id: 'p1',
  name: 'Warm Touch Wand',
  isDigital: false,
  inventoryCount: 5,
  variants: [{ id: 'v1', price: 5000, stock: 5 }],
}

const body = {
  items: [{ productId: 'p1', variantId: 'v1', quantity: 1 }],
  shippingAddress: { line1: '1 Main St', city: 'London', postcode: 'SW1A 1AA', country: 'GB' },
  paymentMethod: 'card',
}

function post(payload: unknown) {
  return POST(new NextRequest('http://localhost/api/orders', { method: 'POST', body: JSON.stringify(payload) }))
}

beforeEach(() => {
  vi.clearAllMocks()
  getSession.mockResolvedValue(null)
  db.customer.findUnique.mockResolvedValue(null)
  db.product.findMany.mockResolvedValue([product])
  db.promotion.findUnique.mockResolvedValue(null)
  db.giftCard.findUnique.mockResolvedValue(null)
  db.loyaltyAccount.findUnique.mockResolvedValue(null)
  db.giftWrappingOption.findFirst.mockResolvedValue(null)
  db.address.findFirst.mockResolvedValue(null)
  db.$transaction.mockImplementation(async (fn: (client: typeof tx) => unknown) => fn(tx))
  tx.address.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'addr_1', ...data }))
  tx.variant.updateMany.mockResolvedValue({ count: 1 })
  tx.product.updateMany.mockResolvedValue({ count: 1 })
  tx.promotion.updateMany.mockResolvedValue({ count: 1 })
  tx.giftCard.updateMany.mockResolvedValue({ count: 1 })
  tx.loyaltyAccount.updateMany.mockResolvedValue({ count: 1 })
  tx.order.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
    id: 'ord_1',
    reference: data.reference,
    totalCents: data.totalCents,
    currency: 'USD',
    status: data.status,
  }))
  sendOrderConfirmationFor.mockResolvedValue(undefined)
})

describe('POST /api/orders', () => {
  it('rejects a request with no session and no guest email', async () => {
    const res = await post(body)
    expect(res.status).toBe(400)
    expect(db.$transaction).not.toHaveBeenCalled()
  })

  it('creates a guest order with a customer-less address', async () => {
    const res = await post({ ...body, guestEmail: 'guest@example.com' })
    expect(res.status).toBe(200)
    expect(tx.address.create.mock.calls[0][0].data.customerId).toBeNull()
    const order = tx.order.create.mock.calls[0][0].data
    expect(order.customerId).toBeNull()
    expect(order.guestEmail).toBe('guest@example.com')
    expect(order.loyaltyPointsEarned).toBe(0)
  })

  it('takes the buyer from the session even when the body claims to be a guest', async () => {
    getSession.mockResolvedValue({ customerId: 'cust_1', email: 'me@example.com' })
    db.customer.findUnique.mockResolvedValue({ id: 'cust_1', email: 'me@example.com', firstName: 'Ada', lastName: 'L' })

    const res = await post({ ...body, isGuest: true, guestEmail: 'someone-else@example.com' })
    expect(res.status).toBe(200)
    const order = tx.order.create.mock.calls[0][0].data
    expect(order.customerId).toBe('cust_1')
    expect(order.guestEmail).toBeNull()
    expect(tx.address.create.mock.calls[0][0].data.customerId).toBe('cust_1')
    expect(order.loyaltyPointsEarned).toBe(62)
  })

  it('returns 400 and creates no order when the last unit was sold during checkout', async () => {
    tx.variant.updateMany.mockResolvedValue({ count: 0 })

    const res = await post({ ...body, guestEmail: 'guest@example.com' })
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('OUT_OF_STOCK')
    expect(tx.order.create).not.toHaveBeenCalled()
  })

  it('rejects a promo code id that does not exist', async () => {
    const res = await post({ ...body, guestEmail: 'guest@example.com', promoCodeId: 'missing' })
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('PROMO_INVALID')
  })

  it('creates a normal order as PENDING and sends no confirmation yet', async () => {
    const res = await post({ ...body, guestEmail: 'guest@example.com' })
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(tx.order.create.mock.calls[0][0].data.status).toBe('PENDING')
    expect(json.order.status).toBe('PENDING')
    expect(sendOrderConfirmationFor).not.toHaveBeenCalled()
  })

  it('confirms an order inside the transaction when a gift card covers the whole total', async () => {
    db.giftCard.findUnique.mockResolvedValue({ id: 'g1', balanceCents: 100000, expiresAt: null, isExpired: false })

    const res = await post({ ...body, guestEmail: 'guest@example.com', giftCardId: 'g1', giftCardAppliedCents: 100000 })
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.order.totalCents).toBe(0)
    expect(tx.order.create.mock.calls[0][0].data.status).toBe('PAYMENT_RECEIVED')
    expect(json.order.status).toBe('PAYMENT_RECEIVED')
    expect(sendOrderConfirmationFor).toHaveBeenCalledWith('ord_1')
    expect(tx.giftCard.updateMany.mock.calls[0][0].data).toEqual({ balanceCents: { decrement: 6200 } })
  })

  it('still succeeds when the confirmation email for a zero-total order fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    db.giftCard.findUnique.mockResolvedValue({ id: 'g1', balanceCents: 100000, expiresAt: null, isExpired: false })
    sendOrderConfirmationFor.mockRejectedValue(new Error('smtp down'))

    const res = await post({ ...body, guestEmail: 'guest@example.com', giftCardId: 'g1', giftCardAppliedCents: 100000 })
    expect(res.status).toBe(200)
    expect((await res.json()).order.status).toBe('PAYMENT_RECEIVED')
    expect(errorSpy).toHaveBeenCalledTimes(1)
    errorSpy.mockRestore()
  })

  it('does not reuse a saved address that belongs to another customer', async () => {
    getSession.mockResolvedValue({ customerId: 'cust_1', email: 'me@example.com' })
    db.customer.findUnique.mockResolvedValue({ id: 'cust_1', email: 'me@example.com', firstName: 'Ada', lastName: 'L' })

    await post({ ...body, shippingAddress: { ...body.shippingAddress, id: 'addr_of_someone_else' } })
    expect(db.address.findFirst).toHaveBeenCalledWith({ where: { id: 'addr_of_someone_else', customerId: 'cust_1' } })
    expect(tx.address.create).toHaveBeenCalledTimes(1)
  })
})
