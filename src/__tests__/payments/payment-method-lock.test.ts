// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// The real createPaymentIntent / createCryptoCharge run here; only the
// database, the session, the Stripe SDK and fetch are faked.
const { db, getSession, intentsCreate, intentsRetrieve, intentsCancel } = vi.hoisted(() => ({
  db: { order: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() } },
  getSession: vi.fn(),
  intentsCreate: vi.fn(),
  intentsRetrieve: vi.fn(),
  intentsCancel: vi.fn(),
}))

vi.mock('@/lib/db', () => ({ db }))
vi.mock('@/lib/auth/session', () => ({ getSession }))
vi.mock('@/lib/orders/lifecycle', () => ({ markOrderPaid: vi.fn(), cancelOrderAndRelease: vi.fn() }))
vi.mock('@/lib/config', () => ({ config: { coinbase: {}, app: {} } }))
vi.mock('@/lib/payments/methods', () => ({ getAvailablePaymentMethods: () => ({ crypto: true }) }))
vi.mock('stripe', () => ({
  default: class {
    paymentIntents = { create: intentsCreate, retrieve: intentsRetrieve, cancel: intentsCancel }
  },
}))

import { POST as createIntent } from '@/app/api/payment/create-intent/route'
import { POST as createCharge } from '@/app/api/payment/crypto-charge/route'
import { createPaymentIntent } from '@/lib/payments/stripe'
import { createCryptoCharge } from '@/lib/payments/coinbase'
import { PaymentMethodLockedError } from '@/lib/payments/locked'

const coinbaseMessage =
  'This order is waiting for your crypto payment. To pay another way, go back and place the order again.'
const bankMessage =
  'This order is waiting for your bank transfer. To pay another way, go back and place the order again.'

const pendingOrder = {
  id: 'ord_1',
  reference: 'CLABC123',
  status: 'PENDING',
  totalCents: 6200,
  currency: 'USD',
  customerId: null,
  guestEmail: 'guest@example.com',
  paymentProvider: null,
  paymentRef: null,
}

function post(handler: (request: NextRequest) => Promise<Response>, path: string) {
  return handler(
    new NextRequest(`http://localhost/api/payment/${path}`, {
      method: 'POST',
      body: JSON.stringify({ orderId: 'ord_1', guestEmail: 'guest@example.com' }),
    })
  )
}

const fetchSpy = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', fetchSpy)
  getSession.mockResolvedValue(null)
})

describe('payment method lock', () => {
  it('create-intent returns 409 for a PENDING coinbase order', async () => {
    db.order.findUnique.mockResolvedValue({ ...pendingOrder, paymentProvider: 'coinbase', paymentRef: 'ch_1' })
    const res = await post(createIntent, 'create-intent')
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ error: coinbaseMessage })
    expect(intentsCreate).not.toHaveBeenCalled()
    expect(db.order.updateMany).not.toHaveBeenCalled()
  })

  it('create-intent returns 409 for a PENDING bank_transfer order', async () => {
    db.order.findUnique.mockResolvedValue({ ...pendingOrder, paymentProvider: 'bank_transfer', paymentRef: 'BT-CLABC123' })
    const res = await post(createIntent, 'create-intent')
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ error: bankMessage })
    expect(intentsCreate).not.toHaveBeenCalled()
    expect(db.order.updateMany).not.toHaveBeenCalled()
  })

  it('crypto-charge returns 409 for a PENDING bank_transfer order', async () => {
    db.order.findUnique.mockResolvedValue({ ...pendingOrder, paymentProvider: 'bank_transfer', paymentRef: 'BT-CLABC123' })
    const res = await post(createCharge, 'crypto-charge')
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ error: bankMessage })
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(db.order.updateMany).not.toHaveBeenCalled()
  })

  it.each(['coinbase', 'bank_transfer'] as const)(
    'createPaymentIntent throws PaymentMethodLockedError for a %s order and creates no intent',
    async (paymentProvider) => {
      db.order.findUnique.mockResolvedValue({ ...pendingOrder, paymentProvider, paymentRef: 'ref_1' })
      await expect(createPaymentIntent('ord_1')).rejects.toBeInstanceOf(PaymentMethodLockedError)
      expect(intentsCreate).not.toHaveBeenCalled()
      expect(db.order.update).not.toHaveBeenCalled()
    }
  )

  it('createPaymentIntent claims the order with a conditional write', async () => {
    db.order.findUnique.mockResolvedValue(pendingOrder)
    intentsCreate.mockResolvedValue({ id: 'pi_1', client_secret: 'secret_1' })
    db.order.updateMany.mockResolvedValue({ count: 1 })
    expect(await createPaymentIntent('ord_1')).toEqual({ clientSecret: 'secret_1', paymentIntentId: 'pi_1' })
    expect(intentsCreate).toHaveBeenCalledTimes(1)
    expect(db.order.updateMany).toHaveBeenCalledWith({
      where: { id: 'ord_1', status: 'PENDING', OR: [{ paymentProvider: null }, { paymentProvider: 'stripe' }] },
      data: { paymentMethod: 'card', paymentProvider: 'stripe', paymentRef: 'pi_1' },
    })
    expect(intentsCancel).not.toHaveBeenCalled()
  })

  it('createPaymentIntent cancels its intent and throws the lock error when bank details won the race', async () => {
    db.order.findUnique
      .mockResolvedValueOnce(pendingOrder)
      .mockResolvedValueOnce({ status: 'PENDING', paymentProvider: 'bank_transfer' })
    intentsCreate.mockResolvedValue({ id: 'pi_1', client_secret: 'secret_1' })
    intentsCancel.mockResolvedValue({})
    db.order.updateMany.mockResolvedValue({ count: 0 })
    await expect(createPaymentIntent('ord_1')).rejects.toBeInstanceOf(PaymentMethodLockedError)
    expect(intentsCancel).toHaveBeenCalledWith('pi_1')
  })

  it('createPaymentIntent throws a plain error when the order was cancelled meanwhile', async () => {
    db.order.findUnique
      .mockResolvedValueOnce(pendingOrder)
      .mockResolvedValueOnce({ status: 'CANCELLED', paymentProvider: null })
    intentsCreate.mockResolvedValue({ id: 'pi_1', client_secret: 'secret_1' })
    intentsCancel.mockResolvedValue({})
    db.order.updateMany.mockResolvedValue({ count: 0 })
    const err = await createPaymentIntent('ord_1').catch((e) => e)
    expect(err).toBeInstanceOf(Error)
    expect(err).not.toBeInstanceOf(PaymentMethodLockedError)
    expect(intentsCancel).toHaveBeenCalledWith('pi_1')
  })

  it('createCryptoCharge throws the lock error when bank details won the race', async () => {
    db.order.findUnique
      .mockResolvedValueOnce(pendingOrder)
      .mockResolvedValueOnce({ status: 'PENDING', paymentProvider: 'bank_transfer' })
    fetchSpy.mockResolvedValue({ json: async () => ({ data: { id: 'ch_1', hosted_url: 'https://pay.example/ch_1' } }) })
    db.order.updateMany.mockResolvedValue({ count: 0 })
    await expect(createCryptoCharge('ord_1')).rejects.toBeInstanceOf(PaymentMethodLockedError)
    expect(db.order.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'ord_1',
        status: 'PENDING',
        OR: [{ paymentProvider: null }, { paymentProvider: { not: 'bank_transfer' } }],
      },
      data: { paymentMethod: 'crypto', paymentProvider: 'coinbase', paymentRef: 'ch_1' },
    })
  })
})
