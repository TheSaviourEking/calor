import { NextRequest, NextResponse } from 'next/server'
import { createCryptoCharge } from '@/lib/payments/coinbase'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { canAccessOrder } from '@/lib/orders/access'
import { getAvailablePaymentMethods } from '@/lib/payments/methods'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, guestEmail } = body

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    if (!getAvailablePaymentMethods().crypto) {
      return NextResponse.json({ error: 'Crypto payments are not available' }, { status: 503 })
    }

    const order = await db.order.findUnique({ where: { id: orderId } })
    const session = await getSession()

    if (!order || !canAccessOrder(order, { customerId: session?.customerId, guestEmail })) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.status !== 'PENDING') {
      return NextResponse.json({ error: 'This order can no longer be paid' }, { status: 409 })
    }

    const result = await createCryptoCharge(orderId)

    return NextResponse.json({
      success: true,
      chargeId: result.chargeId,
      hostedUrl: result.hostedUrl,
    })
  } catch (error) {
    console.error('Crypto charge creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create crypto charge' },
      { status: 500 }
    )
  }
}
