import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/payments/stripe'

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('session_id')
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    })

    return NextResponse.json({
      status: session.status,
      subscription: session.subscription,
      customerEmail: session.customer_details?.email,
    })
  } catch (error) {
    console.error('Success verification error:', error)
    return NextResponse.json({ error: 'Failed to verify session' }, { status: 500 })
  }
}
