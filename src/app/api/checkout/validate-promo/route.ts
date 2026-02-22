import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, subtotalCents } = body

    if (!code) {
      return NextResponse.json({ error: 'Promo code is required' }, { status: 400 })
    }

    const promo = await db.promotion.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (!promo) {
      return NextResponse.json({ error: 'Invalid promo code' }, { status: 400 })
    }

    // Check if active
    if (!promo.isActive) {
      return NextResponse.json({ error: 'This promo code is no longer active' }, { status: 400 })
    }

    // Check dates
    const now = new Date()
    if (promo.startsAt > now) {
      return NextResponse.json({ error: 'This promo code is not yet active' }, { status: 400 })
    }
    if (promo.endsAt < now) {
      return NextResponse.json({ error: 'This promo code has expired' }, { status: 400 })
    }

    // Check usage limit
    if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
      return NextResponse.json({ error: 'This promo code has reached its usage limit' }, { status: 400 })
    }

    // Check minimum order
    if (promo.minOrderCents && subtotalCents < promo.minOrderCents) {
      return NextResponse.json({ 
        error: `Minimum order of $${(promo.minOrderCents / 100).toFixed(2)} required`,
        minOrder: promo.minOrderCents 
      }, { status: 400 })
    }

    // Calculate discount
    let discountCents = 0
    if (promo.type === 'percentage') {
      discountCents = Math.floor((subtotalCents * promo.value) / 100)
      if (promo.maxDiscountCents) {
        discountCents = Math.min(discountCents, promo.maxDiscountCents)
      }
    } else if (promo.type === 'fixed') {
      discountCents = promo.value
    } else if (promo.type === 'free_shipping') {
      discountCents = 0 // Handled separately
    }

    return NextResponse.json({
      valid: true,
      promo: {
        id: promo.id,
        code: promo.code,
        name: promo.name,
        type: promo.type,
        value: promo.value,
        discountCents,
        maxDiscountCents: promo.maxDiscountCents,
      },
    })
  } catch (error) {
    console.error('Promo validation error:', error)
    return NextResponse.json({ error: 'Failed to validate promo code' }, { status: 500 })
  }
}
