import { NextRequest, NextResponse } from 'next/server'
import { createPaymentIntent } from '@/lib/payments/stripe'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, guestEmail } = body

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    const order = await db.order.findUnique({ where: { id: orderId } })
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Verify ownership: either an authenticated session owns the order,
    // or the supplied guestEmail matches the order's guestEmail
    const session = await getSession()
    const isOwner =
      (session?.customerId && order.customerId === session.customerId) ||
      (order.guestEmail && guestEmail && order.guestEmail === guestEmail)

    if (!isOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await createPaymentIntent(orderId)

    return NextResponse.json({
      success: true,
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
    })
  } catch (error) {
    console.error('Payment intent creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
