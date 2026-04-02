import Stripe from 'stripe'
import { db } from '@/lib/db'
import { sendOrderConfirmation } from '@/lib/email'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder')

export async function createPaymentIntent(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  })

  if (!order) throw new Error('Order not found')

  const paymentIntent = await stripe.paymentIntents.create({
    amount: order.totalCents,
    currency: order.currency.toLowerCase(),
    metadata: {
      orderId: order.id,
      reference: order.reference,
    },
    statement_descriptor: 'CALOR CO',
    description: `CALŌR order ${order.reference}`,
  })

  // Update order with payment reference
  await db.order.update({
    where: { id: orderId },
    data: {
      paymentMethod: 'card',
      paymentProvider: 'stripe',
      paymentRef: paymentIntent.id,
    },
  })

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  }
}

export async function handleStripeWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const { orderId, _reference } = paymentIntent.metadata

      const order = await db.order.update({
        where: { id: orderId },
        data: { status: 'PAYMENT_RECEIVED' },
        include: {
          customer: true,
          items: { include: { product: true } },
        },
      })

      // Send confirmation email
      if (order.customer) {
        await sendOrderConfirmation({
          customerEmail: order.customer.email,
          customerName: order.customer.firstName,
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

      break
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const { orderId } = paymentIntent.metadata

      await db.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      })

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
