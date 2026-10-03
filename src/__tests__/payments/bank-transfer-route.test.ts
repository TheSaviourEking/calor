// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

const { db, getSession, sendBankTransferInstructionsFor } = vi.hoisted(() => ({
  db: { order: { findUnique: vi.fn(), updateMany: vi.fn() } },
  getSession: vi.fn(),
  sendBankTransferInstructionsFor: vi.fn(),
}))

vi.mock('@/lib/db', () => ({ db }))
vi.mock('@/lib/auth/session', () => ({ getSession }))
vi.mock('@/lib/orders/lifecycle', () => ({ sendBankTransferInstructionsFor }))

import { POST } from '@/app/api/payment/bank-transfer/route'

const bankConfig = { DEFAULT: { bankName: 'Test Bank', accountName: 'CALO LTD', iban: 'GB00TEST' } }
const expectedBankDetails = {
  bankName: 'Test Bank',
  accountName: 'CALO LTD',
  accountNumber: null,
  routingNumber: null,
  swiftCode: null,
  iban: 'GB00TEST',
  sortCode: null,
}

const guestOrder = {
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

function post(body: Record<string, unknown>) {
  return POST(
    new NextRequest('http://localhost/api/payment/bank-transfer', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  getSession.mockResolvedValue(null)
  process.env.BANK_TRANSFER_DETAILS = JSON.stringify(bankConfig)
})

afterEach(() => {
  delete process.env.BANK_TRANSFER_DETAILS
})

describe('POST /api/payment/bank-transfer', () => {
  it('returns 404 for a missing order', async () => {
    db.order.findUnique.mockResolvedValue(null)
    const res = await post({ orderId: 'nope', guestEmail: 'guest@example.com' })
    expect(res.status).toBe(404)
  })

  it('returns the same 404 body for an existing order with the wrong guestEmail', async () => {
    db.order.findUnique.mockResolvedValue(null)
    const missing = await post({ orderId: 'nope', guestEmail: 'guest@example.com' })
    db.order.findUnique.mockResolvedValue(guestOrder)
    const wrong = await post({ orderId: 'ord_1', guestEmail: 'other@example.com' })

    expect(wrong.status).toBe(404)
    expect(await wrong.json()).toEqual(await missing.json())
  })

  it('returns 404, not 500, for a non-string guestEmail', async () => {
    db.order.findUnique.mockResolvedValue(guestOrder)
    const res = await post({ orderId: 'ord_1', guestEmail: 1 })
    expect(res.status).toBe(404)
  })

  it('returns 409 for a non-PENDING order', async () => {
    db.order.findUnique.mockResolvedValue({ ...guestOrder, status: 'PAYMENT_RECEIVED' })
    const res = await post({ orderId: 'ord_1', guestEmail: 'guest@example.com' })
    expect(res.status).toBe(409)
  })

  it('returns 409 and writes nothing for a PENDING coinbase order', async () => {
    db.order.findUnique.mockResolvedValue({ ...guestOrder, paymentProvider: 'coinbase', paymentRef: 'ch_1' })
    const res = await post({ orderId: 'ord_1', guestEmail: 'guest@example.com' })
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({
      error: 'This order is waiting for your crypto payment. To pay another way, go back and place the order again.',
    })
    expect(db.order.updateMany).not.toHaveBeenCalled()
    expect(sendBankTransferInstructionsFor).not.toHaveBeenCalled()
  })

  it('returns 503 when bank details are not configured', async () => {
    delete process.env.BANK_TRANSFER_DETAILS
    db.order.findUnique.mockResolvedValue(guestOrder)
    const res = await post({ orderId: 'ord_1', guestEmail: 'guest@example.com' })
    expect(res.status).toBe(503)
  })

  it('issues bank details with one conditional update and emails once', async () => {
    db.order.findUnique.mockResolvedValue(guestOrder)
    db.order.updateMany.mockResolvedValue({ count: 1 })

    const res = await post({ orderId: 'ord_1', guestEmail: 'guest@example.com' })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.paymentRef).toBe('BT-CLABC123')
    expect(db.order.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'ord_1',
        status: 'PENDING',
        OR: [{ paymentProvider: null }, { paymentProvider: { not: 'bank_transfer' } }],
      },
      data: {
        paymentMethod: 'bank',
        paymentProvider: 'bank_transfer',
        paymentRef: 'BT-CLABC123',
      },
    })
    expect(sendBankTransferInstructionsFor).toHaveBeenCalledTimes(1)
    expect(sendBankTransferInstructionsFor).toHaveBeenCalledWith('ord_1', 'BT-CLABC123', expectedBankDetails)
  })

  it('returns the same reference and sends no email when already issued or a race was lost', async () => {
    db.order.findUnique.mockResolvedValue(guestOrder)
    db.order.updateMany.mockResolvedValue({ count: 0 })

    const res = await post({ orderId: 'ord_1', guestEmail: 'guest@example.com' })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.paymentRef).toBe('BT-CLABC123')
    expect(sendBankTransferInstructionsFor).not.toHaveBeenCalled()
  })
})
