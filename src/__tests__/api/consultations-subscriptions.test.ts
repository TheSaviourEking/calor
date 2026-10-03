// @vitest-environment node
/// <reference types="vite/client" />
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { db, getSession, stripe } = vi.hoisted(() => {
  const db: any = {
    consultant: { findUnique: vi.fn() },
    consultationBooking: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    subscription: { findFirst: vi.fn(), update: vi.fn() },
    subscriptionSkip: { findFirst: vi.fn(), create: vi.fn() },
  }
  db.$transaction = vi.fn(async (fn: any) => fn(db))
  return {
    db,
    getSession: vi.fn(),
    stripe: { subscriptions: { update: vi.fn() } },
  }
})

vi.mock('@/lib/db', () => ({ db }))
vi.mock('@/lib/auth/session', () => ({ getSession }))
vi.mock('@/lib/payments/stripe', () => ({ stripe }))
vi.mock('@/lib/payments/stripe-subscriptions', () => ({ createSubscriptionCheckout: vi.fn() }))
vi.mock('@/lib/config', () => ({ config: { app: { baseUrl: 'http://localhost:3000' } } }))

import { POST as consultPost, PUT as consultPut } from '@/app/api/consultations/route'
import { PUT as subPut } from '@/app/api/subscriptions/route'

const req = (method: string, body: unknown) =>
  new NextRequest('http://localhost/api/x', {
    method,
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })

const future = () => new Date(Date.now() + 24 * 3600 * 1000).toISOString()

beforeEach(() => {
  vi.clearAllMocks()
  getSession.mockResolvedValue({ customerId: 'cust1', email: 'a@b.c' })
  db.$transaction.mockImplementation(async (fn: any) => fn(db))
})

describe('consultations PUT', () => {
  it('rejects any status other than cancelled', async () => {
    const res = await consultPut(req('PUT', { bookingId: 'b1', status: 'confirmed' }))
    expect(res.status).toBe(400)
    expect(db.consultationBooking.updateMany).not.toHaveBeenCalled()
  })

  it('rejects cancelling a completed booking', async () => {
    db.consultationBooking.findFirst.mockResolvedValue({ id: 'b1', status: 'completed' })
    const res = await consultPut(req('PUT', { bookingId: 'b1', status: 'cancelled' }))
    expect(res.status).toBe(400)
    expect(db.consultationBooking.updateMany).not.toHaveBeenCalled()
  })

  it('cancels a pending booking with an ownership-scoped write', async () => {
    db.consultationBooking.findFirst.mockResolvedValue({ id: 'b1', status: 'pending' })
    db.consultationBooking.updateMany.mockResolvedValue({ count: 1 })
    db.consultationBooking.findUnique.mockResolvedValue({ id: 'b1', status: 'cancelled' })
    const res = await consultPut(req('PUT', { bookingId: 'b1', status: 'cancelled' }))
    expect(res.status).toBe(200)
    expect(db.consultationBooking.updateMany).toHaveBeenCalledWith({
      where: { id: 'b1', customerId: 'cust1', status: { in: ['pending', 'confirmed'] } },
      data: { status: 'cancelled' },
    })
  })

  it('returns 409 when the scoped write matches nothing', async () => {
    db.consultationBooking.findFirst.mockResolvedValue({ id: 'b1', status: 'pending' })
    db.consultationBooking.updateMany.mockResolvedValue({ count: 0 })
    const res = await consultPut(req('PUT', { bookingId: 'b1', status: 'cancelled' }))
    expect(res.status).toBe(409)
  })
})

describe('consultations POST', () => {
  const valid = () => ({ consultantId: 'c1', scheduledAt: future(), duration: 60, type: 'video' })
  beforeEach(() => {
    db.consultant.findUnique.mockResolvedValue({ id: 'c1', hourlyRate: 10000, isAvailable: true })
    db.consultationBooking.findMany.mockResolvedValue([])
    db.consultationBooking.create.mockImplementation(async ({ data }: any) => ({ id: 'b1', ...data }))
  })

  it('rejects a past scheduledAt', async () => {
    const res = await consultPost(req('POST', { ...valid(), scheduledAt: new Date(Date.now() - 3600000).toISOString() }))
    expect(res.status).toBe(400)
    expect(db.consultationBooking.create).not.toHaveBeenCalled()
  })

  it('rejects an unsupported duration', async () => {
    const res = await consultPost(req('POST', { ...valid(), duration: 1 }))
    expect(res.status).toBe(400)
    expect(db.consultationBooking.create).not.toHaveBeenCalled()
  })

  it('rejects an unknown type', async () => {
    const res = await consultPost(req('POST', { ...valid(), type: 'carrier-pigeon' }))
    expect(res.status).toBe(400)
    expect(db.consultationBooking.create).not.toHaveBeenCalled()
  })

  it('rejects an unavailable consultant', async () => {
    db.consultant.findUnique.mockResolvedValue({ id: 'c1', hourlyRate: 10000, isAvailable: false })
    const res = await consultPost(req('POST', valid()))
    expect(res.status).toBe(400)
    expect(db.consultationBooking.create).not.toHaveBeenCalled()
  })

  it('returns 409 for an overlapping booking and does not create', async () => {
    const body = valid()
    const start = new Date(body.scheduledAt).getTime()
    db.consultationBooking.findMany.mockResolvedValue([
      { scheduledAt: new Date(start + 15 * 60000), duration: 30 },
    ])
    const res = await consultPost(req('POST', body))
    expect(res.status).toBe(409)
    expect(db.consultationBooking.create).not.toHaveBeenCalled()
  })

  it('creates a valid booking with the server-computed price', async () => {
    const res = await consultPost(req('POST', { ...valid(), duration: 45, priceCents: 1 }))
    expect(res.status).toBe(200)
    const data = db.consultationBooking.create.mock.calls[0][0].data
    expect(data.priceCents).toBe(7500)
    expect(data.customerId).toBe('cust1')
  })
})

describe('subscriptions PUT', () => {
  const sub = (status: string) => ({ id: 's1', status, stripeSubscriptionId: 'sub_1' })

  it('cancel keeps status and sets cancelAtPeriodEnd', async () => {
    db.subscription.findFirst.mockResolvedValue(sub('active'))
    db.subscription.update.mockResolvedValue({ id: 's1' })
    const res = await subPut(req('PUT', { subscriptionId: 's1', action: 'cancel', reason: '  too pricey  ' }))
    expect(res.status).toBe(200)
    const data = db.subscription.update.mock.calls[0][0].data
    expect(data.cancelAtPeriodEnd).toBe(true)
    expect(data.cancellationReason).toBe('too pricey')
    expect(data.status).toBeUndefined()
  })

  it('resume on an active subscription is 400 with no Stripe call', async () => {
    db.subscription.findFirst.mockResolvedValue(sub('active'))
    const res = await subPut(req('PUT', { subscriptionId: 's1', action: 'resume' }))
    expect(res.status).toBe(400)
    expect(stripe.subscriptions.update).not.toHaveBeenCalled()
  })

  it('pause on a paused subscription is 400', async () => {
    db.subscription.findFirst.mockResolvedValue(sub('paused'))
    const res = await subPut(req('PUT', { subscriptionId: 's1', action: 'pause' }))
    expect(res.status).toBe(400)
    expect(stripe.subscriptions.update).not.toHaveBeenCalled()
  })

  it('skip_next twice for the same month creates one skip', async () => {
    db.subscription.findFirst.mockResolvedValue(sub('active'))
    db.subscriptionSkip.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'k1' })
    const a = await subPut(req('PUT', { subscriptionId: 's1', action: 'skip_next' }))
    const b = await subPut(req('PUT', { subscriptionId: 's1', action: 'skip_next' }))
    expect(a.status).toBe(200)
    expect(b.status).toBe(200)
    expect(db.subscriptionSkip.create).toHaveBeenCalledTimes(1)
  })
})
