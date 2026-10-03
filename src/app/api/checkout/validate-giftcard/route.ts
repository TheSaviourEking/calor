import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rateLimitByIp } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Slow down guessing of codes
    const rl = await rateLimitByIp(request, 'giftcard:validate', { windowMs: 60_000, maxRequests: 10 })
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 })
    }

    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json({ error: 'Gift card code is required' }, { status: 400 })
    }

    const giftCard = await db.giftCard.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (!giftCard) {
      return NextResponse.json({ error: 'Invalid gift card code' }, { status: 400 })
    }

    // Check if already redeemed fully
    if (giftCard.balanceCents <= 0) {
      return NextResponse.json({ error: 'This gift card has no remaining balance' }, { status: 400 })
    }

    // Check if expired
    if (giftCard.expiresAt && giftCard.expiresAt < new Date()) {
      return NextResponse.json({ error: 'This gift card has expired' }, { status: 400 })
    }

    return NextResponse.json({
      valid: true,
      giftCard: {
        id: giftCard.id,
        code: giftCard.code,
        balanceCents: giftCard.balanceCents,
        expiresAt: giftCard.expiresAt,
      },
    })
  } catch (error) {
    console.error('Gift card validation error:', error)
    return NextResponse.json({ error: 'Failed to validate gift card' }, { status: 500 })
  }
}
