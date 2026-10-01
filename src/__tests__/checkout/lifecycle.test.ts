// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { db, tx, sendOrderConfirmation } = vi.hoisted(() => {
  const tx = {
    order: { updateMany: vi.fn(), findUnique: vi.fn() },
    variant: { updateMany: vi.fn() },
    product: { update: vi.fn() },
    loyaltyAccount: { findUnique: vi.fn(), update: vi.fn() },
    loyaltyTransaction: { create: vi.fn() },
    giftCardTransaction: { findMany: vi.fn(), create: vi.fn() },
    giftCard: { update: vi.fn() },
  }
  const db = {
    order: { updateMany: vi.fn(), findUnique: vi.fn() },
    $transaction: vi.fn(async (fn: (client: typeof tx) => unknown) => fn(tx)),
  }
  return { db, tx, sendOrderConfirmation: vi.fn(async () => ({ success: true })) }
})

vi.mock('@/lib/db', () => ({ db }))
vi.mock('@/lib/email', () => ({ sendOrderConfirmation }))

import { markOrderPaid, cancelOrderAndRelease } from '@/lib/orders/lifecycle'

const paidOrder = {
  id: 'ord_1',
  reference: 'CLABC123',
  totalCents: 6200,
  currency: 'USD',
  guestEmail: 'guest@example.com',
  customer: null,
  items: [{ name: 'Warm Touch Wand', quantity: 1, priceCents: 5000 }],
}

beforeEach(() => {
  vi.clearAllMocks()
  db.$transaction.mockImplementation(async (fn: (client: typeof tx) => unknown) => fn(tx))
})

describe('markOrderPaid', () => {
  it('moves a pending order to PAYMENT_RECEIVED and emails the guest address', async () => {
    db.order.updateMany.mockResolvedValue({ count: 1 })
    db.order.findUnique.mockResolvedValue(paidOrder)

    expect(await markOrderPaid('ord_1')).toBe(true)
    expect(db.order.updateMany).toHaveBeenCalledWith({
      where: { id: 'ord_1', status: 'PENDING' },
      data: { status: 'PAYMENT_RECEIVED' },
    })
    expect(sendOrderConfirmation).toHaveBeenCalledTimes(1)
    expect(sendOrderConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({ customerEmail: 'guest@example.com', orderReference: 'CLABC123', total: 6200 })
    )
  })

  it('does nothing on a repeated delivery', async () => {
    db.order.updateMany.mockResolvedValue({ count: 0 })

    expect(await markOrderPaid('ord_1')).toBe(false)
    expect(sendOrderConfirmation).not.toHaveBeenCalled()
  })
})

describe('cancelOrderAndRelease', () => {
  const cancelled = {
    id: 'ord_1',
    reference: 'CLABC123',
    customerId: 'cust_1',
    loyaltyPointsUsed: 300,
    items: [
      { productId: 'p1', variantId: 'v1', quantity: 2, product: { isDigital: false } },
      { productId: 'p2', variantId: null, quantity: 1, product: { isDigital: true } },
    ],
  }

  it('restores stock, points and gift card balance exactly once', async () => {
    tx.order.updateMany.mockResolvedValue({ count: 1 })
    tx.order.findUnique.mockResolvedValue(cancelled)
    tx.loyaltyAccount.findUnique.mockResolvedValue({ id: 'acct_1' })
    tx.giftCardTransaction.findMany.mockResolvedValue([{ giftCardId: 'g1', amountCents: 1500 }])

    expect(await cancelOrderAndRelease('ord_1')).toBe(true)

    expect(tx.variant.updateMany).toHaveBeenCalledTimes(1)
    expect(tx.variant.updateMany).toHaveBeenCalledWith({ where: { id: 'v1' }, data: { stock: { increment: 2 } } })
    expect(tx.product.update).toHaveBeenCalledTimes(1)
    expect(tx.product.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { inventoryCount: { increment: 2 }, purchaseCount: { decrement: 2 } },
    })
    expect(tx.loyaltyAccount.update).toHaveBeenCalledWith({
      where: { id: 'acct_1' },
      data: { points: { increment: 300 }, totalUsed: { decrement: 300 } },
    })
    expect(tx.giftCard.update).toHaveBeenCalledWith({
      where: { id: 'g1' },
      data: { balanceCents: { increment: 1500 }, isRedeemed: false, redeemedAt: null },
    })
    expect(tx.giftCardTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ giftCardId: 'g1', amountCents: -1500, type: 'refund', orderId: 'ord_1' }),
    })
  })

  it('releases nothing when the order is no longer pending', async () => {
    tx.order.updateMany.mockResolvedValue({ count: 0 })

    expect(await cancelOrderAndRelease('ord_1')).toBe(false)
    expect(tx.order.findUnique).not.toHaveBeenCalled()
    expect(tx.variant.updateMany).not.toHaveBeenCalled()
    expect(tx.product.update).not.toHaveBeenCalled()
  })
})
