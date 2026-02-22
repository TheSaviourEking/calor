import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { sendGiftCardEmail } from '@/lib/email'

// Generate a unique gift card code
function generateGiftCardCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'CAL'
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (type === 'purchased') {
      const giftCards = await db.giftCard.findMany({
        where: { purchaserId: session.customerId },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json({ giftCards })
    }

    if (type === 'redeemed') {
      const giftCards = await db.giftCard.findMany({
        where: { redeemedById: session.customerId },
        orderBy: { redeemedAt: 'desc' },
      })
      return NextResponse.json({ giftCards })
    }

    // Get all gift cards for this customer
    const giftCards = await db.giftCard.findMany({
      where: {
        OR: [
          { purchaserId: session.customerId },
          { redeemedById: session.customerId },
        ],
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ giftCards })
  } catch (error) {
    console.error('Gift cards fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gift cards' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    const body = await request.json()

    const {
      valueCents,
      recipientEmail,
      recipientName,
      senderName,
      message,
      scheduledDelivery,
      orderId,
    } = body

    if (!valueCents || !recipientEmail) {
      return NextResponse.json(
        { error: 'Value and recipient email are required' },
        { status: 400 }
      )
    }

    if (valueCents < 500 || valueCents > 50000) {
      return NextResponse.json(
        { error: 'Gift card value must be between $5 and $500' },
        { status: 400 }
      )
    }

    // Generate unique code
    let code = generateGiftCardCode()
    let attempts = 0
    while (attempts < 10) {
      const existing = await db.giftCard.findUnique({ where: { code } })
      if (!existing) break
      code = generateGiftCardCode()
      attempts++
    }

    // Calculate expiry (1 year from now)
    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)

    const giftCard = await db.giftCard.create({
      data: {
        code,
        initialValueCents: valueCents,
        balanceCents: valueCents,
        purchaserId: session?.customerId || null,
        recipientEmail,
        recipientName,
        senderName,
        message,
        scheduledDelivery: scheduledDelivery ? new Date(scheduledDelivery) : null,
        expiresAt,
        orderId,
      },
    })

    // Send email immediately if no scheduled delivery
    if (!scheduledDelivery) {
      try {
        await sendGiftCardEmail({
          recipientEmail,
          recipientName: recipientName || 'there',
          senderName: senderName || 'Someone special',
          code: giftCard.code,
          value: valueCents,
          message: message || '',
        })

        await db.giftCard.update({
          where: { id: giftCard.id },
          data: { isDelivered: true },
        })
      } catch (emailError) {
        console.error('Failed to send gift card email:', emailError)
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      giftCard: {
        id: giftCard.id,
        code: giftCard.code,
        initialValueCents: giftCard.initialValueCents,
        recipientEmail: giftCard.recipientEmail,
        expiresAt: giftCard.expiresAt,
      },
    })
  } catch (error) {
    console.error('Gift card creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create gift card' },
      { status: 500 }
    )
  }
}
