import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customer = await db.customer.findUnique({
      where: { id: session.customerId },
      select: { isAdmin: true },
    })
    if (!customer?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id: orderId } = await params
    const body = await request.json()
    const { amountCents, reason = 'requested_by_customer' } = body

    const order = await db.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        reference: true,
        totalCents: true,
        status: true,
        paymentRef: true,
        paymentProvider: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.status === 'REFUNDED') {
      return NextResponse.json({ error: 'Order already refunded' }, { status: 400 })
    }

    if (order.paymentProvider !== 'stripe' || !order.paymentRef) {
      return NextResponse.json(
        { error: 'This order cannot be refunded automatically — payment was not made via Stripe' },
        { status: 400 }
      )
    }

    // Find the Stripe PaymentIntent and its charge
    const paymentIntent = await stripe.paymentIntents.retrieve(order.paymentRef)
    const chargeId = paymentIntent.latest_charge as string

    if (!chargeId) {
      return NextResponse.json({ error: 'No charge found for this payment' }, { status: 400 })
    }

    // Issue refund
    const refundParams: Stripe.RefundCreateParams = {
      charge: chargeId,
      reason: reason as Stripe.RefundCreateParams['reason'],
    }

    // If partial refund amount provided, use it; otherwise full refund
    if (amountCents && amountCents < order.totalCents) {
      refundParams.amount = amountCents
    }

    const refund = await stripe.refunds.create(refundParams)

    // Update order status
    await db.order.update({
      where: { id: orderId },
      data: { status: 'REFUNDED' },
    })

    // Log audit entry
    await db.auditLog.create({
      data: {
        adminId: session.customerId,
        adminEmail: customer ? undefined : undefined,
        action: 'update',
        entity: 'order',
        entityId: orderId,
        description: `Refund issued for order ${order.reference} — ${refund.status} — $${((refund.amount || order.totalCents) / 100).toFixed(2)}`,
        success: true,
      },
    })

    return NextResponse.json({
      success: true,
      refundId: refund.id,
      status: refund.status,
      amountRefunded: refund.amount,
    })
  } catch (error) {
    console.error('Refund error:', error)
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Refund failed' }, { status: 500 })
  }
}
