import { NextRequest, NextResponse } from 'next/server'
import { verifyCoinbaseWebhook, handleCryptoWebhook } from '@/lib/payments/coinbase'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-cc-webhook-signature')!

  if (!verifyCoinbaseWebhook(signature, body)) {
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  const event = JSON.parse(body)

  try {
    await handleCryptoWebhook(event)
  } catch (error) {
    console.error('Crypto webhook handler error:', error)
    return NextResponse.json(
      { error: 'Handler failed' },
      { status: 500 }
    )
  }

  return NextResponse.json({ received: true })
}
