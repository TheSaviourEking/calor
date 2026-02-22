import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Bank account details (in production, these would be environment variables)
const BANK_DETAILS = {
  US: {
    bankName: 'First National Bank',
    accountName: 'CALOR LLC',
    accountNumber: '****1234', // Masked for security
    routingNumber: '****5678',
    swiftCode: null,
    iban: null,
  },
  EU: {
    bankName: 'European Bank',
    accountName: 'CALOR LLC',
    accountNumber: null,
    routingNumber: null,
    swiftCode: 'CALOXX12',
    iban: 'XX12 3456 7890 1234 5678',
  },
  UK: {
    bankName: 'British Bank',
    accountName: 'CALOR LTD',
    accountNumber: '****9876',
    routingNumber: null,
    swiftCode: 'CALOGB12',
    iban: 'GB12 3456 7890 1234 5678',
    sortCode: '12-34-56',
  },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, region = 'US' } = body

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    // Get order
    const order = await db.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Generate unique payment reference
    const paymentRef = `BT-${order.reference}-${Date.now().toString(36).toUpperCase()}`

    // Update order with bank transfer details
    await db.order.update({
      where: { id: orderId },
      data: {
        paymentMethod: 'bank',
        paymentProvider: 'bank_transfer',
        paymentRef,
      },
    })

    // Get bank details for region
    const bankDetails = BANK_DETAILS[region as keyof typeof BANK_DETAILS] || BANK_DETAILS.US

    return NextResponse.json({
      success: true,
      paymentRef,
      bankDetails: {
        ...bankDetails,
        reference: paymentRef,
        amount: (order.totalCents / 100).toFixed(2),
        currency: order.currency,
      },
      instructions: [
        `Transfer exactly $${(order.totalCents / 100).toFixed(2)} ${order.currency}`,
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
