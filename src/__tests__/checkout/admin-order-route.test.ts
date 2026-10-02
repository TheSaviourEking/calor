// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { db, requireAdmin, markOrderPaid, cancelOrderAndRelease, sendShippingNotification } = vi.hoisted(() => ({
  db: {
    order: { findUnique: vi.fn(), update: vi.fn() },
    loyaltyAccount: { upsert: vi.fn() },
    loyaltyTransaction: { create: vi.fn() },
  },
  requireAdmin: vi.fn(),
  markOrderPaid: vi.fn(),
  cancelOrderAndRelease: vi.fn(),
  sendShippingNotification: vi.fn(),
}))

vi.mock('@/lib/db', () => ({ db }))
vi.mock('@/lib/admin/middleware', () => ({ requireAdmin }))
vi.mock('@/lib/orders/lifecycle', () => ({ markOrderPaid, cancelOrderAndRelease }))
vi.mock('@/lib/email', () => ({ sendShippingNotification }))

import { PATCH } from '@/app/api/admin/orders/[id]/route'

const baseOrder = {
  id: 'ord_1',
  reference: 'CLABC123',
  status: 'PENDING',
  customerId: 'cust_1',
  guestEmail: null,
  trackingNumber: null,
  estimatedDelivery: null,
  loyaltyPointsEarned: 62,
  customer: { email: 'buyer@example.com', firstName: 'Ada' },
  items: [],
  address: null,
}

// The stored order: lifecycle calls and plain updates both change it
let stored: typeof baseOrder & Record<string, unknown>

function patch(body: Record<string, unknown>) {
  return PATCH(
    new NextRequest('http://localhost/api/admin/orders/ord_1', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: 'ord_1' }) }
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  stored = { ...baseOrder }
  requireAdmin.mockResolvedValue({ authorized: true, customerId: 'admin_1' })
  db.order.findUnique.mockImplementation(async () => ({ ...stored }))
  db.order.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
    stored = { ...stored, ...data }
    return { ...stored }
  })
  db.loyaltyAccount.upsert.mockResolvedValue({ id: 'loy_1' })
  cancelOrderAndRelease.mockImplementation(async () => {
    stored = { ...stored, status: 'CANCELLED' }
    return true
  })
  markOrderPaid.mockImplementation(async () => {
    stored = { ...stored, status: 'PAYMENT_RECEIVED' }
    return true
  })
})

describe('PATCH /api/admin/orders/[id]', () => {
  it('rejects a caller who is not an admin', async () => {
    requireAdmin.mockResolvedValue({ authorized: false, error: 'Unauthorized' })
    const res = await patch({ status: 'CANCELLED' })
    expect(res.status).toBe(401)
    expect(cancelOrderAndRelease).not.toHaveBeenCalled()
    expect(db.order.update).not.toHaveBeenCalled()
  })

  it('cancels a PENDING order through the lifecycle and does not write the status directly', async () => {
    const res = await patch({ status: 'CANCELLED' })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(cancelOrderAndRelease).toHaveBeenCalledTimes(1)
    expect(cancelOrderAndRelease).toHaveBeenCalledWith('ord_1')
    expect(db.order.update).not.toHaveBeenCalled()
    expect(json.order.status).toBe('CANCELLED')
    expect(json.order.reference).toBe('CLABC123')
  })

  it('confirms a PENDING order through the lifecycle', async () => {
    const res = await patch({ status: 'PAYMENT_RECEIVED' })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(markOrderPaid).toHaveBeenCalledTimes(1)
    expect(markOrderPaid).toHaveBeenCalledWith('ord_1')
    expect(db.order.update).not.toHaveBeenCalled()
    expect(json.order.status).toBe('PAYMENT_RECEIVED')
  })

  it('still writes the other fields, without the status, after a lifecycle transition', async () => {
    const res = await patch({ status: 'CANCELLED', trackingNumber: 'TRK1' })

    expect(res.status).toBe(200)
    expect(cancelOrderAndRelease).toHaveBeenCalledWith('ord_1')
    expect(db.order.update).toHaveBeenCalledTimes(1)
    expect(db.order.update.mock.calls[0][0].data).toEqual({ trackingNumber: 'TRK1' })
  })

  it.each(['CANCELLED', 'REFUNDED'])('refuses to move a %s order to another status', async (status) => {
    stored = { ...baseOrder, status }

    const res = await patch({ status: 'PROCESSING' })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'A cancelled or refunded order cannot change status' })
    expect(db.order.update).not.toHaveBeenCalled()
    expect(markOrderPaid).not.toHaveBeenCalled()
    expect(cancelOrderAndRelease).not.toHaveBeenCalled()
  })

  it('returns 409 when the cancellation lost a race', async () => {
    cancelOrderAndRelease.mockResolvedValue(false)

    const res = await patch({ status: 'CANCELLED', trackingNumber: 'TRK1' })
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ error: 'Order status changed, please reload' })
    expect(db.order.update).not.toHaveBeenCalled()
  })

  it('returns 409 when the confirmation lost a race', async () => {
    markOrderPaid.mockResolvedValue(false)

    const res = await patch({ status: 'PAYMENT_RECEIVED' })
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ error: 'Order status changed, please reload' })
    expect(db.order.update).not.toHaveBeenCalled()
  })

  it('still does a plain update for PAYMENT_RECEIVED to SHIPPED and notifies the buyer', async () => {
    stored = { ...baseOrder, status: 'PAYMENT_RECEIVED' }

    const res = await patch({ status: 'SHIPPED', trackingNumber: 'TRK1' })
    expect(res.status).toBe(200)
    expect(markOrderPaid).not.toHaveBeenCalled()
    expect(cancelOrderAndRelease).not.toHaveBeenCalled()

    const update = db.order.update.mock.calls[0][0]
    expect(update.where).toEqual({ id: 'ord_1' })
    expect(update.data.status).toBe('SHIPPED')
    expect(update.data.trackingNumber).toBe('TRK1')
    expect(update.data.estimatedDelivery).toBeInstanceOf(Date)
    expect(sendShippingNotification).toHaveBeenCalledTimes(1)
    expect((await res.json()).order.status).toBe('SHIPPED')
  })

  it('still awards loyalty points on DELIVERED', async () => {
    stored = { ...baseOrder, status: 'SHIPPED' }

    const res = await patch({ status: 'DELIVERED' })
    expect(res.status).toBe(200)
    expect(db.order.update.mock.calls[0][0].data).toEqual({ status: 'DELIVERED' })
    expect(db.loyaltyAccount.upsert).toHaveBeenCalledTimes(1)
    expect(db.loyaltyTransaction.create).toHaveBeenCalledTimes(1)
  })

  it('updates a tracking number without touching the lifecycle when no status is sent', async () => {
    const res = await patch({ trackingNumber: 'TRK1' })
    expect(res.status).toBe(200)
    expect(db.order.update.mock.calls[0][0].data).toEqual({ trackingNumber: 'TRK1' })
    expect(markOrderPaid).not.toHaveBeenCalled()
    expect(cancelOrderAndRelease).not.toHaveBeenCalled()
  })
})
