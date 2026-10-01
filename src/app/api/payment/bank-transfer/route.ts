import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { canAccessOrder } from '@/lib/orders/access'
import { getBankDetails } from '@/lib/payments/methods'
import { sendOrderConfirmationFor } from '@/lib/orders/lifecycle'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, guestEmail, region = 'US' } = body

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
    })
    const session = await getSession()

    if (!order || !canAccessOrder(order, { customerId: session?.customerId, guestEmail })) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.status !== 'PENDING') {
      return NextResponse.json({ error: 'This order can no longer be paid' }, { status: 409 })
    }

    const bankDetails = getBankDetails(String(region))
    if (!bankDetails) {
      return NextResponse.json({ error: 'Bank transfer is not available' }, { status: 503 })
    }

    // Keep one stable reference per order so a reload shows the same instructions
    const alreadyIssued = order.paymentProvider === 'bank_transfer' && !!order.paymentRef
    const paymentRef = alreadyIssued ? order.paymentRef! : `BT-${order.reference}`

    if (!alreadyIssued) {
      await db.order.update({
        where: { id: orderId },
        data: {
          paymentMethod: 'bank',
          paymentProvider: 'bank_transfer',
          paymentRef,
        },
      })
      // Bank orders have no payment webhook, so this is where the buyer is emailed
      await sendOrderConfirmationFor(orderId)
    }

    const amount = (order.totalCents / 100).toFixed(2)

    return NextResponse.json({
      success: true,
      paymentRef,
      bankDetails: {
        ...bankDetails,
        reference: paymentRef,
        amount,
        currency: order.currency,
      },
      instructions: [
        `Transfer exactly $${amount} ${order.currency}`,
        `Include reference: ${paymentRef}`,
        'Payment will be confirmed within 1-2 business days',
        'Your order will ship after payment confirmation',
      ],
    })
  } catch (error) {
    console.error('Bank transfer setup error:', error)
    return NextResponse.json(
      { error: 'Failed to setup bank transfer' },
      { status: 500 }
    )
  }
}
