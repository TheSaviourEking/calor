import Stripe from 'stripe'
import { db } from '@/lib/db'
import { sendOrderConfirmation } from '@/lib/email'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2023-10-16',
})

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
      const { orderId, reference } = paymentIntent.metadata

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
  }
}
