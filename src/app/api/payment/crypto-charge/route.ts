import { NextRequest, NextResponse } from 'next/server'
import { createCryptoCharge } from '@/lib/payments/coinbase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
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
