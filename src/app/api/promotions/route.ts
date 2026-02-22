import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin/middleware'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const active = searchParams.get('active')
    const type = searchParams.get('type')

    const where: Record<string, unknown> = {}
    
    if (active === 'true') {
      where.isActive = true
      where.startsAt = { lte: new Date() }
      where.endsAt = { gte: new Date() }
    }

    if (type) {
      where.type = type
    }

    const promotions = await db.promotion.findMany({ take: 50,
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ promotions })
  } catch (error) {
    console.error('Promotions fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch promotions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      code,
      name,
      description,
      type,
      value,
      minOrderCents,
      maxDiscountCents,
      startsAt,
      endsAt,
      usageLimit,
      appliesTo,
      isFlashSale,
      flashSalePrice,
    } = body

    // Check if code already exists
    if (code) {
      const existing = await db.promotion.findUnique({ where: { code } })
      if (existing) {
        return NextResponse.json(
          { error: 'Promo code already exists' },
          { status: 400 }
        )
      }
    }

    const promotion = await db.promotion.create({
      data: {
        code: code || null,
        name,
        description,
        type,
        value,
        minOrderCents,
        maxDiscountCents,
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        usageLimit,
        appliesTo: appliesTo ? JSON.stringify(appliesTo) : null,
        isFlashSale: isFlashSale || false,
        flashSalePrice,
      },
    })

    return NextResponse.json({ promotion })
  } catch (error) {
    console.error('Promotion creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create promotion' },
      { status: 500 }
    )
  }
}
