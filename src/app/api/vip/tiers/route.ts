import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/vip/tiers - Get all VIP tiers
export async function GET() {
  try {
    const tiers = await db.vIPTier.findMany({ /* take: handled */
      where: { isActive: true },
      include: {
        benefits: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { level: 'asc' },
    })

    return NextResponse.json({ tiers })
  } catch (error) {
    console.error('Error fetching VIP tiers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch VIP tiers' },
      { status: 500 }
    )
  }
}

// POST /api/vip/tiers - Create a new VIP tier (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      slug,
      level,
      minPoints,
      minSpent,
      pointsMultiplier,
      freeShippingThreshold,
      birthdayBonus,
      earlyAccess,
      exclusiveProducts,
      prioritySupport,
      freeReturns,
      iconName,
      colorHex,
      description,
      benefits,
    } = body

    const tier = await db.vIPTier.create({
      data: {
        name,
        slug,
        level: level || 0,
        minPoints: minPoints || 0,
        minSpent: minSpent || 0,
        pointsMultiplier: pointsMultiplier || 1,
        freeShippingThreshold,
        birthdayBonus: birthdayBonus || 0,
        earlyAccess: earlyAccess || false,
        exclusiveProducts: exclusiveProducts || false,
        prioritySupport: prioritySupport || false,
        freeReturns: freeReturns || false,
        iconName,
        colorHex,
        description,
        benefits: benefits
          ? {
            create: benefits.map((b: { name: string; description?: string; iconName?: string; sortOrder?: number }) => ({
              name: b.name,
              description: b.description,
              iconName: b.iconName,
              sortOrder: b.sortOrder || 0,
            })),
          }
          : undefined,
      },
      include: {
        benefits: true,
      },
    })

    return NextResponse.json({ tier })
  } catch (error) {
    console.error('Error creating VIP tier:', error)
    return NextResponse.json(
      { error: 'Failed to create VIP tier' },
      { status: 500 }
    )
  }
}

// PUT /api/vip/tiers - Update a VIP tier (admin only)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Tier ID is required' },
        { status: 400 }
      )
    }

    const tier = await db.vIPTier.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        level: data.level,
        minPoints: data.minPoints,
        minSpent: data.minSpent,
        pointsMultiplier: data.pointsMultiplier,
        freeShippingThreshold: data.freeShippingThreshold,
        birthdayBonus: data.birthdayBonus,
        earlyAccess: data.earlyAccess,
        exclusiveProducts: data.exclusiveProducts,
        prioritySupport: data.prioritySupport,
        freeReturns: data.freeReturns,
        iconName: data.iconName,
        colorHex: data.colorHex,
        description: data.description,
        isActive: data.isActive,
      },
      include: {
        benefits: true,
      },
    })

    return NextResponse.json({ tier })
  } catch (error) {
    console.error('Error updating VIP tier:', error)
    return NextResponse.json(
      { error: 'Failed to update VIP tier' },
      { status: 500 }
    )
  }
}
