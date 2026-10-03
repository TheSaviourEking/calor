// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { db, tx, sendOrderConfirmation, sendBankTransferInstructions } = vi.hoisted(() => {
  const tx = {
    order: { updateMany: vi.fn(), findUnique: vi.fn() },
    variant: { updateMany: vi.fn() },
    product: { update: vi.fn() },
    loyaltyAccount: { findUnique: vi.fn(), update: vi.fn() },
    loyaltyTransaction: { findMany: vi.fn(), create: vi.fn() },
    giftCardTransaction: { findMany: vi.fn(), create: vi.fn() },
    giftCard: { update: vi.fn() },
  }
  const db = {
    order: { updateMany: vi.fn(), findUnique: vi.fn() },
    $transaction: vi.fn(async (fn: (client: typeof tx) => unknown) => fn(tx)),
  }
  return {
    db,
    tx,
    sendOrderConfirmation: vi.fn(async () => ({ success: true })),
    sendBankTransferInstructions: vi.fn(async () => ({ success: true })),
  }
})

vi.mock('@/lib/db', () => ({ db }))
vi.mock('@/lib/email', () => ({ sendOrderConfirmation, sendBankTransferInstructions }))

import { markOrderPaid, cancelOrderAndRelease, sendBankTransferInstructionsFor } from '@/lib/orders/lifecycle'

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

describe('sendBankTransferInstructionsFor', () => {
  const bankDetails = {
    bankName: 'Test Bank',
    accountName: 'CALO LTD',
    accountNumber: null,
    routingNumber: null,
    swiftCode: null,
    iban: 'GB00TEST',
    sortCode: null,
  }

  it('emails the guest address with the reference and bank details', async () => {
    db.order.findUnique.mockResolvedValue(paidOrder)

    await sendBankTransferInstructionsFor('ord_1', 'BT-CLABC123', bankDetails)

    expect(sendBankTransferInstructions).toHaveBeenCalledTimes(1)
    expect(sendBankTransferInstructions).toHaveBeenCalledWith({
      customerEmail: 'guest@example.com',
      customerName: 'there',
      orderReference: 'CLABC123',
      total: 6200,
      currency: 'USD',
      paymentRef: 'BT-CLABC123',
      bankDetails,
    })
    expect(sendOrderConfirmation).not.toHaveBeenCalled()
  })

  it('does nothing when the order has no email', async () => {
    db.order.findUnique.mockResolvedValue({ ...paidOrder, guestEmail: null, customer: null })

    await sendBankTransferInstructionsFor('ord_1', 'BT-CLABC123', bankDetails)

    expect(sendBankTransferInstructions).not.toHaveBeenCalled()
  })

  it('does nothing when the order does not exist', async () => {
    db.order.findUnique.mockResolvedValue(null)

    await sendBankTransferInstructionsFor('ord_1', 'BT-CLABC123', bankDetails)

    expect(sendBankTransferInstructions).not.toHaveBeenCalled()
  })
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

  it('still returns true when the confirmation email fails', async () => {
    db.order.updateMany.mockResolvedValue({ count: 1 })
    db.order.findUnique.mockResolvedValue(paidOrder)
    sendOrderConfirmation.mockRejectedValueOnce(new Error('smtp down'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(await markOrderPaid('ord_1')).toBe(true)
    expect(db.order.updateMany).toHaveBeenCalledTimes(1)
    expect(errorSpy).toHaveBeenCalledTimes(1)
    errorSpy.mockRestore()
  })

  it('does nothing on a repeated delivery', async () => {
    db.order.updateMany.mockResolvedValue({ count: 0 })
    db.order.findUnique.mockResolvedValue({ status: 'PAYMENT_RECEIVED', reference: 'CLABC123' })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(await markOrderPaid('ord_1')).toBe(false)
    expect(sendOrderConfirmation).not.toHaveBeenCalled()
    expect(errorSpy).not.toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('logs and returns false when payment arrives for a cancelled order', async () => {
    db.order.updateMany.mockResolvedValue({ count: 0 })
    db.order.findUnique.mockResolvedValue({ status: 'CANCELLED', reference: 'CLABC123' })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(await markOrderPaid('ord_1')).toBe(false)
    expect(sendOrderConfirmation).not.toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalledTimes(1)
    errorSpy.mockRestore()
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
    tx.loyaltyTransaction.findMany.mockResolvedValue([{ accountId: 'acct_1', points: -300 }])
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
    expect(tx.loyaltyTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ accountId: 'acct_1', points: 300, type: 'refund', orderId: 'ord_1' }),
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

  it('refunds nothing when no points were actually redeemed', async () => {
    tx.order.updateMany.mockResolvedValue({ count: 1 })
    tx.order.findUnique.mockResolvedValue({ ...cancelled, loyaltyPointsUsed: 1000000 })
    tx.loyaltyTransaction.findMany.mockResolvedValue([])
    tx.giftCardTransaction.findMany.mockResolvedValue([])

    expect(await cancelOrderAndRelease('ord_1')).toBe(true)
    expect(tx.loyaltyAccount.update).not.toHaveBeenCalled()
    expect(tx.loyaltyTransaction.create).not.toHaveBeenCalled()
  })

  it('refunds exactly the redeemed points from the transaction rows', async () => {
    tx.order.updateMany.mockResolvedValue({ count: 1 })
    tx.order.findUnique.mockResolvedValue({ ...cancelled, loyaltyPointsUsed: 999 })
    tx.loyaltyTransaction.findMany.mockResolvedValue([{ accountId: 'acct_1', points: -300 }])
    tx.giftCardTransaction.findMany.mockResolvedValue([])

    await cancelOrderAndRelease('ord_1')
    expect(tx.loyaltyAccount.update).toHaveBeenCalledWith({
      where: { id: 'acct_1' },
      data: { points: { increment: 300 }, totalUsed: { decrement: 300 } },
    })
    expect(tx.loyaltyTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ accountId: 'acct_1', points: 300, type: 'refund' }),
    })
  })

  it('scopes the cancellation to the payment reference when given', async () => {
    tx.order.updateMany.mockResolvedValue({ count: 0 })

    expect(await cancelOrderAndRelease('ord_1', 'pi_old')).toBe(false)
    expect(tx.order.updateMany).toHaveBeenCalledWith({
      where: { id: 'ord_1', status: 'PENDING', paymentRef: 'pi_old' },
      data: { status: 'CANCELLED' },
    })
    expect(tx.order.findUnique).not.toHaveBeenCalled()
    expect(tx.product.update).not.toHaveBeenCalled()
  })

  it('requires the order to still have no reference when null is given', async () => {
    tx.order.updateMany.mockResolvedValue({ count: 0 })

    await cancelOrderAndRelease('ord_1', null)
    expect(tx.order.updateMany).toHaveBeenCalledWith({
      where: { id: 'ord_1', status: 'PENDING', paymentRef: null },
      data: { status: 'CANCELLED' },
    })
  })

  it('has no paymentRef key in the where when undefined is given', async () => {
    tx.order.updateMany.mockResolvedValue({ count: 0 })

    await cancelOrderAndRelease('ord_1', undefined)
    const where = tx.order.updateMany.mock.calls[0][0].where
    expect(where).toEqual({ id: 'ord_1', status: 'PENDING' })
    expect('paymentRef' in where).toBe(false)
  })

  it('does not scope by reference when none is given', async () => {
    tx.order.updateMany.mockResolvedValue({ count: 0 })

    await cancelOrderAndRelease('ord_1')
    expect(tx.order.updateMany).toHaveBeenCalledWith({
      where: { id: 'ord_1', status: 'PENDING' },
      data: { status: 'CANCELLED' },
    })
  })
})
