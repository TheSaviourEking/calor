import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { canAccessOrder } from '@/lib/orders/access'
import { cancelOrderAndRelease } from '@/lib/orders/lifecycle'
import { stripe } from '@/lib/payments/stripe'

// The buyer abandons an unpaid order (for example by starting checkout again):
// everything it reserved goes back.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => null)
    const guestEmail: unknown = body && typeof body === 'object' ? body.guestEmail : undefined

    const order = await db.order.findUnique({ where: { id } })
    const session = await getSession()

    // Same response for "missing" and "not yours" so order ids cannot be probed
    if (!order || !canAccessOrder(order, { customerId: session?.customerId, guestEmail })) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.status !== 'PENDING') {
      return NextResponse.json({ error: 'This order can no longer be cancelled' }, { status: 409 })
    }

    if (order.paymentProvider === 'stripe' && order.paymentRef) {
      try {
        const intent = await stripe.paymentIntents.retrieve(order.paymentRef)
        if (intent.status === 'succeeded' || intent.status === 'processing') {
          return NextResponse.json({ error: 'Payment is already in progress for this order' }, { status: 409 })
        }
        if (intent.status !== 'canceled') {
          await stripe.paymentIntents.cancel(order.paymentRef)
        }
      } catch (err) {
        // A stale payment reference must not block the release
        console.error('[ORDER] Failed to cancel payment intent:', err)
      }
    }

    const cancelled = await cancelOrderAndRelease(order.id)

    return NextResponse.json({ success: true, cancelled })
  } catch (error) {
    console.error('Order cancel error:', error)
    return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 })
  }
}
