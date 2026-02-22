import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, orderTotal } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Promo code is required' },
        { status: 400 }
      )
    }

    const promotion = await db.promotion.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (!promotion) {
      return NextResponse.json(
        { valid: false, error: 'Invalid promo code' },
        { status: 404 }
      )
    }

    // Check if active
    const now = new Date()
    if (!promotion.isActive) {
      return NextResponse.json({
        valid: false,
        error: 'This promo code is no longer active',
      })
    }

    if (promotion.startsAt > now) {
      return NextResponse.json({
        valid: false,
        error: 'This promo code is not yet active',
      })
    }

    if (promotion.endsAt < now) {
      return NextResponse.json({
        valid: false,
        error: 'This promo code has expired',
      })
    }

    // Check usage limit
    if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
      return NextResponse.json({
        valid: false,
        error: 'This promo code has reached its usage limit',
      })
    }

    // Check minimum order
    if (promotion.minOrderCents && orderTotal < promotion.minOrderCents) {
      return NextResponse.json({
        valid: false,
        error: `Minimum order of $${(promotion.minOrderCents / 100).toFixed(2)} required`,
        minOrder: promotion.minOrderCents,
      })
    }

    // Calculate discount
    let discountAmount = 0
    if (promotion.type === 'percentage') {
      discountAmount = Math.floor((orderTotal * promotion.value) / 100)
      if (promotion.maxDiscountCents) {
        discountAmount = Math.min(discountAmount, promotion.maxDiscountCents)
      }
    } else if (promotion.type === 'fixed') {
      discountAmount = promotion.value
    } else if (promotion.type === 'free_shipping') {
      discountAmount = 0 // Handled separately in checkout
    }

    return NextResponse.json({
      valid: true,
      promotion: {
        id: promotion.id,
        code: promotion.code,
        name: promotion.name,
        type: promotion.type,
        value: promotion.value,
        discountAmount,
        isFreeShipping: promotion.type === 'free_shipping',
      },
    })
  } catch (error) {
    console.error('Promo check error:', error)
    return NextResponse.json(
      { error: 'Failed to check promo code' },
      { status: 500 }
    )
  }
}
