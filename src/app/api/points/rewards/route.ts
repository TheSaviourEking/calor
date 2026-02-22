import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/points/rewards - Get available rewards for redemption
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const featured = searchParams.get('featured')

    const now = new Date()

    const rewards = await db.pointsReward.findMany({ take: 50,
      where: {
        isActive: true,
        OR: [
          { availableFrom: null },
          { availableFrom: { lte: now } },
        ],
        OR: [
          { availableUntil: null },
          { availableUntil: { gte: now } },
        ],
        ...(featured === 'true' && { featured: true }),
      },
      orderBy: [
        { featured: 'desc' },
        { sortOrder: 'asc' },
      ],
    })

    // Check availability for each reward
    const rewardsWithAvailability = await Promise.all(
      rewards.map(async (reward) => {
        let available = true
        let unavailableReason = null

        // Check quantity
        if (reward.quantityAvailable !== null && reward.quantityClaimed >= reward.quantityAvailable) {
          available = false
          unavailableReason = 'Sold out'
        }

        // Check customer limit
        if (customerId && reward.perCustomerLimit) {
          const customerRedemptions = await db.pointsRedemption.count({
            where: {
              customerId,
              rewardId: reward.id,
              status: { not: 'cancelled' },
            },
          })
          if (customerRedemptions >= reward.perCustomerLimit) {
            available = false
            unavailableReason = 'Limit reached'
          }
        }

        // Check tier requirement
        if (customerId && reward.minTierId) {
          const progress = await db.customerVIPProgress.findUnique({
            where: { customerId },
            include: { currentTier: true },
          })
          const requiredTier = await db.vIPTier.findUnique({
            where: { id: reward.minTierId },
          })
          if (progress?.currentTier && requiredTier) {
            if (progress.currentTier.level < requiredTier.level) {
              available = false
              unavailableReason = `Requires ${requiredTier.name} tier`
            }
          }
        }

        return {
          ...reward,
          available,
          unavailableReason,
        }
      })
    )

    return NextResponse.json({ rewards: rewardsWithAvailability })
  } catch (error) {
    console.error('Error fetching points rewards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rewards' },
      { status: 500 }
    )
  }
}

// POST /api/points/rewards - Create a new reward (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      type,
      pointsCost,
      discountCents,
      discountPercent,
      productId,
      giftCardValue,
      quantityAvailable,
      perCustomerLimit,
      minTierId,
      imageUrl,
      iconName,
      featured,
      availableFrom,
      availableUntil,
    } = body

    const reward = await db.pointsReward.create({
      data: {
        name,
        description,
        type,
        pointsCost,
        discountCents,
        discountPercent,
        productId,
        giftCardValue,
        quantityAvailable,
        perCustomerLimit,
        minTierId,
        imageUrl,
        iconName,
        featured: featured || false,
        availableFrom: availableFrom ? new Date(availableFrom) : null,
        availableUntil: availableUntil ? new Date(availableUntil) : null,
      },
    })

    return NextResponse.json({ reward })
  } catch (error) {
    console.error('Error creating points reward:', error)
    return NextResponse.json(
      { error: 'Failed to create reward' },
      { status: 500 }
    )
  }
}
