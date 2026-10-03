// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { db, getSession, cancelOrderAndRelease, retrieve, cancel } = vi.hoisted(() => ({
  db: { order: { findUnique: vi.fn() } },
  getSession: vi.fn(),
  cancelOrderAndRelease: vi.fn(),
  retrieve: vi.fn(),
  cancel: vi.fn(),
}))

vi.mock('@/lib/db', () => ({ db }))
vi.mock('@/lib/auth/session', () => ({ getSession }))
vi.mock('@/lib/orders/lifecycle', () => ({ cancelOrderAndRelease }))
vi.mock('@/lib/payments/stripe', () => ({ stripe: { paymentIntents: { retrieve, cancel } } }))

import { POST } from '@/app/api/orders/[id]/cancel/route'

const guestOrder = {
  id: 'ord_1',
  reference: 'CLABC123',
  status: 'PENDING',
  customerId: null,
  guestEmail: 'guest@example.com',
  paymentProvider: null,
  paymentRef: null,
}

const customerOrder = { ...guestOrder, customerId: 'cust_1', guestEmail: null }
const stripeOrder = { ...guestOrder, paymentProvider: 'stripe', paymentRef: 'pi_1' }

function post(id: string, body: Record<string, unknown> = {}) {
  return POST(
    new NextRequest(`http://localhost/api/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) }
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  getSession.mockResolvedValue(null)
  cancelOrderAndRelease.mockResolvedValue(true)
  cancel.mockResolvedValue({ status: 'canceled' })
})

describe('POST /api/orders/[id]/cancel', () => {
  it('returns 404 for a missing order', async () => {
    db.order.findUnique.mockResolvedValue(null)
    const res = await post('nope', { guestEmail: 'guest@example.com' })
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Order not found' })
    expect(cancelOrderAndRelease).not.toHaveBeenCalled()
  })

  it("returns the same 404 body for another customer's order", async () => {
    db.order.findUnique.mockResolvedValue(null)
    const missing = await post('nope')

    getSession.mockResolvedValue({ customerId: 'cust_2' })
    db.order.findUnique.mockResolvedValue(customerOrder)
    const res = await post('ord_1')

    expect(res.status).toBe(404)
    expect(await res.json()).toEqual(await missing.json())
    expect(cancelOrderAndRelease).not.toHaveBeenCalled()
  })

  it('returns 404, not 500, for a guest order with a non-string guestEmail', async () => {
    db.order.findUnique.mockResolvedValue(guestOrder)
    const res = await post('ord_1', { guestEmail: 1 })
    expect(res.status).toBe(404)
    expect(cancelOrderAndRelease).not.toHaveBeenCalled()
  })

  it('returns 409 and releases nothing for an order that is no longer PENDING', async () => {
    db.order.findUnique.mockResolvedValue({ ...stripeOrder, status: 'PAYMENT_RECEIVED' })
    const res = await post('ord_1', { guestEmail: 'guest@example.com' })
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ error: 'This order can no longer be cancelled' })
    expect(retrieve).not.toHaveBeenCalled()
    expect(cancel).not.toHaveBeenCalled()
    expect(cancelOrderAndRelease).not.toHaveBeenCalled()
  })

  it('releases a PENDING order that has no payment provider yet', async () => {
    db.order.findUnique.mockResolvedValue(guestOrder)
    const res = await post('ord_1', { guestEmail: 'guest@example.com' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true, cancelled: true })
    expect(cancelOrderAndRelease).toHaveBeenCalledTimes(1)
    expect(cancelOrderAndRelease).toHaveBeenCalledWith('ord_1')
    expect(retrieve).not.toHaveBeenCalled()
  })

  it("releases the signed-in customer's own order", async () => {
    getSession.mockResolvedValue({ customerId: 'cust_1' })
    db.order.findUnique.mockResolvedValue(customerOrder)
    const res = await post('ord_1')
    expect(res.status).toBe(200)
    expect(cancelOrderAndRelease).toHaveBeenCalledWith('ord_1')
  })

  it('cancels an unpaid Stripe payment intent before releasing the order', async () => {
    db.order.findUnique.mockResolvedValue(stripeOrder)
    retrieve.mockResolvedValue({ id: 'pi_1', status: 'requires_payment_method' })

    const res = await post('ord_1', { guestEmail: 'guest@example.com' })
    expect(res.status).toBe(200)
    expect(retrieve).toHaveBeenCalledWith('pi_1')
    expect(cancel).toHaveBeenCalledWith('pi_1')
    expect(cancelOrderAndRelease).toHaveBeenCalledWith('ord_1')
    expect(cancel.mock.invocationCallOrder[0]).toBeLessThan(cancelOrderAndRelease.mock.invocationCallOrder[0])
  })

  it('does not cancel an already cancelled payment intent again', async () => {
    db.order.findUnique.mockResolvedValue(stripeOrder)
    retrieve.mockResolvedValue({ id: 'pi_1', status: 'canceled' })

    const res = await post('ord_1', { guestEmail: 'guest@example.com' })
    expect(res.status).toBe(200)
    expect(cancel).not.toHaveBeenCalled()
    expect(cancelOrderAndRelease).toHaveBeenCalledWith('ord_1')
  })

  it.each(['succeeded', 'processing'])('returns 409 and releases nothing when the payment intent is %s', async (status) => {
    db.order.findUnique.mockResolvedValue(stripeOrder)
    retrieve.mockResolvedValue({ id: 'pi_1', status })

    const res = await post('ord_1', { guestEmail: 'guest@example.com' })
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ error: 'Payment is already in progress for this order' })
    expect(cancel).not.toHaveBeenCalled()
    expect(cancelOrderAndRelease).not.toHaveBeenCalled()
  })

  it('still releases the order when Stripe cannot be reached', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    db.order.findUnique.mockResolvedValue(stripeOrder)
    retrieve.mockRejectedValue(new Error('No such payment_intent'))

    const res = await post('ord_1', { guestEmail: 'guest@example.com' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true, cancelled: true })
    expect(cancelOrderAndRelease).toHaveBeenCalledWith('ord_1')
    expect(errorSpy).toHaveBeenCalledTimes(1)
    errorSpy.mockRestore()
  })

  it('returns 500 when the release itself fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    db.order.findUnique.mockResolvedValue(guestOrder)
    cancelOrderAndRelease.mockRejectedValue(new Error('db down'))

    const res = await post('ord_1', { guestEmail: 'guest@example.com' })
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'Failed to cancel order' })
    errorSpy.mockRestore()
  })
})
