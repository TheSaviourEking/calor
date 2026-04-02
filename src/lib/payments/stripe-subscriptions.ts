import { stripe } from './stripe'
import { db } from '@/lib/db'
import { config } from '@/lib/config'

export async function ensureStripeProducts() {
  const plans = await db.subscriptionPlan.findMany({ where: { isActive: true } })

  for (const plan of plans) {
    if (plan.stripePriceId) continue

    // Create Stripe product
    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
      metadata: { planId: plan.id },
    })

    // Create Stripe price
    const interval = plan.interval === 'quarterly' ? 'month' : plan.interval as 'month' | 'year'
    const intervalCount = plan.interval === 'quarterly' ? 3 : plan.intervalCount

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.priceCents,
      currency: 'usd',
      recurring: { interval, interval_count: intervalCount },
    })

    await db.subscriptionPlan.update({
      where: { id: plan.id },
      data: { stripeProductId: product.id, stripePriceId: price.id },
    })
  }
}

export async function getOrCreateStripeCustomer(customerId: string): Promise<string> {
  const customer = await db.customer.findUnique({ where: { id: customerId } })
  if (!customer) throw new Error('Customer not found')

  if (customer.stripeCustomerId) return customer.stripeCustomerId

  const stripeCustomer = await stripe.customers.create({
    email: customer.email,
    name: `${customer.firstName} ${customer.lastName}`,
    metadata: { customerId: customer.id },
  })

  await db.customer.update({
    where: { id: customerId },
    data: { stripeCustomerId: stripeCustomer.id },
  })

  return stripeCustomer.id
}

export async function createSubscriptionCheckout(
  customerId: string,
  planId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const plan = await db.subscriptionPlan.findUnique({ where: { id: planId } })
  if (!plan) throw new Error('Plan not found')

  // Ensure plan has Stripe price
  if (!plan.stripePriceId) {
    await ensureStripeProducts()
    const updated = await db.subscriptionPlan.findUnique({ where: { id: planId } })
    if (!updated?.stripePriceId) throw new Error('Failed to sync plan with Stripe')
    plan.stripePriceId = updated.stripePriceId
  }

  const stripeCustomerId = await getOrCreateStripeCustomer(customerId)

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: { customerId, planId },
    },
  })

  return session.url!
}

export async function createCustomerPortalSession(customerId: string): Promise<string> {
  const stripeCustomerId = await getOrCreateStripeCustomer(customerId)

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${config.app.baseUrl}/subscriptions`,
  })

  return session.url
}
