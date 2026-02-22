import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    const body = await request.json()
    const { code, amountCents, orderId } = body

    if (!code || !amountCents) {
      return NextResponse.json(
        { error: 'Gift card code and amount are required' },
        { status: 400 }
      )
    }

    const giftCard = await db.giftCard.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (!giftCard) {
      return NextResponse.json(
        { error: 'Gift card not found' },
        { status: 404 }
      )
    }

    // Check validity
    if (giftCard.isExpired || (giftCard.expiresAt && new Date() > giftCard.expiresAt)) {
      return NextResponse.json(
        { error: 'This gift card has expired' },
        { status: 400 }
      )
    }

    if (giftCard.balanceCents <= 0) {
      return NextResponse.json(
        { error: 'This gift card has no remaining balance' },
        { status: 400 }
      )
    }

    if (amountCents > giftCard.balanceCents) {
      return NextResponse.json(
        { error: `Amount exceeds gift card balance of ${(giftCard.balanceCents / 100).toFixed(2)}` },
        { status: 400 }
      )
    }

    // Redeem the amount
    const [transaction, updatedGiftCard] = await db.$transaction([
      db.giftCardTransaction.create({
        data: {
          giftCardId: giftCard.id,
          amountCents,
          type: 'redemption',
          orderId,
          description: `Redeemed for order`,
        },
      }),
      db.giftCard.update({
        where: { id: giftCard.id },
        data: {
          balanceCents: { decrement: amountCents },
          isRedeemed: session?.customerId ? true : giftCard.isRedeemed,
          redeemedById: session?.customerId || giftCard.redeemedById,
          redeemedAt: session?.customerId ? new Date() : giftCard.redeemedAt,
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      redemption: {
        amountCents,
        remainingBalanceCents: updatedGiftCard.balanceCents,
        transactionId: transaction.id,
      },
      giftCard: {
        code: updatedGiftCard.code,
        balanceCents: updatedGiftCard.balanceCents,
      },
    })
  } catch (error) {
    console.error('Gift card redemption error:', error)
    return NextResponse.json(
      { error: 'Failed to redeem gift card' },
      { status: 500 }
    )
  }
}
