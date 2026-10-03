import Stripe from 'stripe'
import { db } from '@/lib/db'
import { markOrderPaid, cancelOrderAndRelease } from '@/lib/orders/lifecycle'
import { PaymentMethodLockedError } from '@/lib/payments/locked'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder')

export async function createPaymentIntent(orderId: string) {
  const order = await db.order.findUnique({ where: { id: orderId } })

  if (!order) throw new Error('Order not found')
  if (order.status !== 'PENDING') throw new Error('Order is not awaiting payment')

  // Crypto or bank details were already issued: money may be on its way
  if (order.paymentProvider === 'coinbase' || order.paymentProvider === 'bank_transfer') {
    throw new PaymentMethodLockedError(order.paymentProvider)
  }

  // Reuse the open intent when the buyer reloads or comes back to card payment
  if (order.paymentProvider === 'stripe' && order.paymentRef) {
    const existing = await stripe.paymentIntents.retrieve(order.paymentRef)
    const reusable = existing.status !== 'canceled' && existing.status !== 'succeeded'
    if (reusable && existing.amount === order.totalCents) {
      return {
        clientSecret: existing.client_secret,
        paymentIntentId: existing.id,
      }
    }
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: order.totalCents,
    currency: order.currency.toLowerCase(),
    metadata: {
      orderId: order.id,
      reference: order.reference,
    },
    statement_descriptor: 'CALO CO',
    description: `calo. order ${order.reference}`,
  })

  // Conditional write: the order must still be pending and not locked to
  // crypto or bank transfer by a request that ran while we talked to Stripe
  const claimed = await db.order.updateMany({
    where: {
      id: orderId,
      status: 'PENDING',
      OR: [{ paymentProvider: null }, { paymentProvider: 'stripe' }],
    },
    data: { paymentMethod: 'card', paymentProvider: 'stripe', paymentRef: paymentIntent.id },
  })

  if (claimed.count !== 1) {
    // Nobody can pay this intent; do not leave it open
    await stripe.paymentIntents.cancel(paymentIntent.id).catch((err) => {
      console.error('[Stripe] Failed to cancel an unused payment intent:', err)
    })
    const current = await db.order.findUnique({ where: { id: orderId }, select: { status: true, paymentProvider: true } })
    if (current?.status === 'PENDING' && (current.paymentProvider === 'coinbase' || current.paymentProvider === 'bank_transfer')) {
      throw new PaymentMethodLockedError(current.paymentProvider)
    }
    throw new Error('Order is not awaiting payment')
  }

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  }
}

export async function handleStripeWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const { orderId } = paymentIntent.metadata
      if (orderId) await markOrderPaid(orderId)
      break
    }

    case 'payment_intent.payment_failed': {
      // A failed attempt is not terminal — the buyer can retry on the same
      // intent, so the order stays PENDING and keeps its stock.
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      console.warn('[Stripe] Payment attempt failed:', paymentIntent.id)
      break
    }

    case 'payment_intent.canceled': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const { orderId } = paymentIntent.metadata
      if (orderId) await cancelOrderAndRelease(orderId, paymentIntent.id)
      break
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge
      const paymentIntentId = charge.payment_intent as string
      if (paymentIntentId) {
        await db.order.updateMany({
          where: { paymentRef: paymentIntentId },
          data: { status: 'REFUNDED' },
        })
      }
      console.log('[Stripe] Charge refunded:', charge.id)
      break
    }

    case 'charge.refund.updated': {
      const refund = event.data.object as Stripe.Refund
      console.log('[Stripe] Refund updated:', refund.id, 'status:', refund.status)
      break
    }

    case 'customer.subscription.created': {
      const sub = event.data.object as Stripe.Subscription
      const { customerId, planId } = sub.metadata
      if (customerId && planId) {
        const item = sub.items.data[0]
        const periodStart = item ? new Date(item.current_period_start * 1000) : new Date(sub.start_date * 1000)
        const periodEnd = item ? new Date(item.current_period_end * 1000) : new Date(sub.start_date * 1000)

        await db.subscription.upsert({
          where: { id: sub.id },
          create: {
            customerId,
            planId,
            status: 'active',
            stripeSubscriptionId: sub.id,
            startDate: new Date(sub.start_date * 1000),
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
            nextBoxDate: periodStart,
          },
          update: {
            status: 'active',
            stripeSubscriptionId: sub.id,
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
          },
        })
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const existing = await db.subscription.findFirst({
        where: { stripeSubscriptionId: sub.id },
      })
      if (existing) {
        const item = sub.items.data[0]
        const periodStart = item ? new Date(item.current_period_start * 1000) : undefined
        const periodEnd = item ? new Date(item.current_period_end * 1000) : undefined

        const statusMap: Record<string, string> = {
          active: 'active',
          past_due: 'active',
          paused: 'paused',
          canceled: 'cancelled',
          unpaid: 'cancelled',
        }
        await db.subscription.update({
          where: { id: existing.id },
          data: {
            status: statusMap[sub.status] || existing.status,
            ...(periodStart && { currentPeriodStart: periodStart }),
            ...(periodEnd && { currentPeriodEnd: periodEnd }),
          },
        })
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const existing = await db.subscription.findFirst({
        where: { stripeSubscriptionId: sub.id },
      })
      if (existing) {
        await db.subscription.update({
          where: { id: existing.id },
          data: { status: 'cancelled', cancelledAt: new Date() },
        })
      }
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      const subscriptionId = invoice.parent?.subscription_details?.subscription
      if (subscriptionId) {
        const stripeSubId = typeof subscriptionId === 'string' ? subscriptionId : subscriptionId.id
        const sub = await db.subscription.findFirst({
          where: { stripeSubscriptionId: stripeSubId },
        })
        if (sub) {
          const boxMonth = new Date(invoice.period_start * 1000).toISOString().slice(0, 7)
          // Check if an order for this month already exists
          const existingOrder = await db.subscriptionOrder.findFirst({
            where: { subscriptionId: sub.id, boxMonth },
          })
          if (!existingOrder) {
            await db.subscriptionOrder.create({
              data: {
                subscriptionId: sub.id,
                boxMonth,
                status: 'processing',
                boxContents: '[]',
              },
            })
          } else {
            await db.subscriptionOrder.update({
              where: { id: existingOrder.id },
              data: { status: 'processing' },
            })
          }
        }
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const subscriptionId = invoice.parent?.subscription_details?.subscription
      if (subscriptionId) {
        const stripeSubId = typeof subscriptionId === 'string' ? subscriptionId : subscriptionId.id
        await db.subscription.updateMany({
          where: { stripeSubscriptionId: stripeSubId },
          data: { status: 'active' }, // Keep active but Stripe handles retry
        })
      }
      break
    }
  }
}
