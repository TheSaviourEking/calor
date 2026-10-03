import { NextRequest, NextResponse } from 'next/server'
import { createPaymentIntent } from '@/lib/payments/stripe'
import { PaymentMethodLockedError } from '@/lib/payments/locked'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { canAccessOrder } from '@/lib/orders/access'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, guestEmail } = body

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    const order = await db.order.findUnique({ where: { id: orderId } })
    const session = await getSession()

    // Same response for "missing" and "not yours" so order ids cannot be probed
    if (!order || !canAccessOrder(order, { customerId: session?.customerId, guestEmail })) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.status !== 'PENDING') {
      return NextResponse.json({ error: 'This order can no longer be paid' }, { status: 409 })
    }

    const result = await createPaymentIntent(orderId)

    return NextResponse.json({
      success: true,
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
    })
  } catch (error) {
    if (error instanceof PaymentMethodLockedError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    console.error('Payment intent creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
