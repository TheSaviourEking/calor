import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendAbandonedCartEmail } from '@/lib/email'

// Send recovery email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cartId, discountPercent = 10 } = body

    const abandonedCart = await db.abandonedCart.findUnique({
      where: { id: cartId },
      include: {
        customer: true,
      },
    })

    if (!abandonedCart) {
      return NextResponse.json(
        { error: 'Abandoned cart not found' },
        { status: 404 }
      )
    }

    if (!abandonedCart.email && !abandonedCart.customer?.email) {
      return NextResponse.json(
        { error: 'No email address for this cart' },
        { status: 400 }
      )
    }

    const email = abandonedCart.email || abandonedCart.customer?.email
    const name = abandonedCart.customer?.firstName || 'there'
    const cartData = JSON.parse(abandonedCart.cartData)

    // Generate recovery discount code
    const discountCode = `BACK${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    // Create promotion for recovery
    const promotion = await db.promotion.create({
      data: {
        code: discountCode,
        name: `Abandoned Cart Recovery ${discountCode}`,
        description: `${discountPercent}% discount for abandoned cart recovery`,
        type: 'percentage',
        value: discountPercent,
        minOrderCents: 0,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        isActive: true,
        usageLimit: 1,
      },
    })

    // Send recovery email
    await sendAbandonedCartEmail({
      email: email!,
      name,
      cartData,
      discountCode,
      discountPercent,
    })

    // Update abandoned cart
    await db.abandonedCart.update({
      where: { id: cartId },
      data: {
        recoveryEmailsSent: { increment: 1 },
        lastEmailSentAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      promotion,
      emailsSent: abandonedCart.recoveryEmailsSent + 1,
    })
  } catch (error) {
    console.error('Recovery email error:', error)
    return NextResponse.json(
      { error: 'Failed to send recovery email' },
      { status: 500 }
    )
  }
}
