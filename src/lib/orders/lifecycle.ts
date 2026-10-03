import { db } from '@/lib/db'
import { sendOrderConfirmation, sendBankTransferInstructions } from '@/lib/email'
import type { BankDetails } from '@/lib/payments/methods'

// Every payment-driven status change goes through this file. Each transition
// is a conditional update on the current status, so a webhook delivered twice
// changes state (and sends email, and releases stock) only once.

export async function sendOrderConfirmationFor(orderId: string): Promise<void> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { customer: true, items: true },
  })
  if (!order) return

  const email = order.customer?.email ?? order.guestEmail
  if (!email) return

  await sendOrderConfirmation({
    customerEmail: email,
    customerName: order.customer?.firstName ?? 'there',
    orderReference: order.reference,
    total: order.totalCents,
    currency: order.currency,
    items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.priceCents,
    })),
  })
}

export async function sendBankTransferInstructionsFor(
  orderId: string,
  paymentRef: string,
  bankDetails: BankDetails
): Promise<void> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { customer: true },
  })
  if (!order) return

  const email = order.customer?.email ?? order.guestEmail
  if (!email) return

  await sendBankTransferInstructions({
    customerEmail: email,
    customerName: order.customer?.firstName ?? 'there',
    orderReference: order.reference,
    total: order.totalCents,
    currency: order.currency,
    paymentRef,
    bankDetails,
  })
}

export async function markOrderPaid(orderId: string): Promise<boolean> {
  const result = await db.order.updateMany({
    where: { id: orderId, status: 'PENDING' },
    data: { status: 'PAYMENT_RECEIVED' },
  })
  if (result.count !== 1) {
    // Already paid is a duplicate delivery; anything else means money arrived
    // for an order that can no longer be fulfilled and needs a human.
    const current = await db.order.findUnique({
      where: { id: orderId },
      select: { status: true, reference: true },
    })
    const status = current?.status
    if (!current || status === 'PENDING' || status === 'CANCELLED' || status === 'REFUNDED') {
      console.error('[orders] Payment received for an order that is not awaiting payment:', { orderId, status })
    }
    return false
  }

  await sendOrderConfirmationFor(orderId)
  return true
}

export async function cancelOrderAndRelease(orderId: string, paymentRef?: string): Promise<boolean> {
  return db.$transaction(async (tx) => {
    const result = await tx.order.updateMany({
      where: paymentRef ? { id: orderId, status: 'PENDING', paymentRef } : { id: orderId, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    })
    if (result.count !== 1) return false

    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: { select: { isDigital: true } } } } },
    })
    if (!order) return false

    // Return reserved stock
    for (const item of order.items) {
      if (item.product.isDigital) continue

      if (item.variantId) {
        await tx.variant.updateMany({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        })
      }
      await tx.product.update({
        where: { id: item.productId },
        data: {
          inventoryCount: { increment: item.quantity },
          purchaseCount: { decrement: item.quantity },
        },
      })
    }

    // Return only the points that were actually deducted (negative rows)
    const pointRedemptions = await tx.loyaltyTransaction.findMany({
      where: { orderId, type: 'redemption' },
    })
    for (const row of pointRedemptions) {
      const points = -row.points
      await tx.loyaltyAccount.update({
        where: { id: row.accountId },
        data: { points: { increment: points }, totalUsed: { decrement: points } },
      })
      await tx.loyaltyTransaction.create({
        data: {
          accountId: row.accountId,
          points,
          type: 'refund',
          description: `Order ${order.reference} cancelled`,
          orderId,
        },
      })
    }

    // Return gift card balance
    const redemptions = await tx.giftCardTransaction.findMany({
      where: { orderId, type: 'redemption' },
    })
    for (const redemption of redemptions) {
      await tx.giftCard.update({
        where: { id: redemption.giftCardId },
        data: { balanceCents: { increment: redemption.amountCents }, isRedeemed: false, redeemedAt: null },
      })
      await tx.giftCardTransaction.create({
        data: {
          giftCardId: redemption.giftCardId,
          amountCents: -redemption.amountCents,
          type: 'refund',
          orderId,
          description: `Order ${order.reference} cancelled`,
        },
      })
    }

    return true
  })
}
