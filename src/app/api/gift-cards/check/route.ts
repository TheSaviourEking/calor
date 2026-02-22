import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Gift card code is required' },
        { status: 400 }
      )
    }

    const giftCard = await db.giftCard.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    })

    if (!giftCard) {
      return NextResponse.json(
        { error: 'Gift card not found' },
        { status: 404 }
      )
    }

    // Check if expired
    if (giftCard.expiresAt && new Date() > giftCard.expiresAt) {
      await db.giftCard.update({
        where: { id: giftCard.id },
        data: { isExpired: true },
      })
      return NextResponse.json({
        valid: false,
        error: 'This gift card has expired',
        giftCard: {
          code: giftCard.code,
          isExpired: true,
        },
      })
    }

    // Check if fully redeemed
    if (giftCard.balanceCents <= 0) {
      return NextResponse.json({
        valid: false,
        error: 'This gift card has no remaining balance',
        giftCard: {
          code: giftCard.code,
          balanceCents: 0,
        },
      })
    }

    return NextResponse.json({
      valid: true,
      giftCard: {
        code: giftCard.code,
        initialValueCents: giftCard.initialValueCents,
        balanceCents: giftCard.balanceCents,
        currency: giftCard.currency,
        expiresAt: giftCard.expiresAt,
        recentTransactions: giftCard.transactions,
      },
    })
  } catch (error) {
    console.error('Gift card check error:', error)
    return NextResponse.json(
      { error: 'Failed to check gift card' },
      { status: 500 }
    )
  }
}
