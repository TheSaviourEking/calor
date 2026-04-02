import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

// POST - Create checkout session (store form data server-side)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    const body = await request.json()

    const checkoutSession = await db.checkoutSession.create({
      data: {
        customerId: session?.customerId || null,
        guestEmail: body.email || null,
        data: body,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      },
    })

    return NextResponse.json({ sessionId: checkoutSession.id })
  } catch (error) {
    console.error('Checkout session creation error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}

// GET - Retrieve checkout session data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('id')

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    const checkoutSession = await db.checkoutSession.findUnique({
      where: { id: sessionId },
    })

    if (!checkoutSession || checkoutSession.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Session expired or not found' }, { status: 404 })
    }

    return NextResponse.json({ data: checkoutSession.data })
  } catch (error) {
    console.error('Checkout session fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch checkout session' }, { status: 500 })
  }
}
