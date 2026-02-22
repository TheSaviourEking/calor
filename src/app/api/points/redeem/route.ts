import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// GET /api/points/redeem - Get customer's redemption history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId is required' },
        { status: 400 }
      )
    }

    const redemptions = await db.pointsRedemption.findMany({ take: 50,
      where: { customerId },
      include: {
        reward: true,
      },
      orderBy: { redeemedAt: 'desc' },
    })

    return NextResponse.json({ redemptions })
  } catch (error) {
    console.error('Error fetching redemptions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch redemptions' },
      { status: 500 }
    )
  }
}

// POST /api/points/redeem - Redeem points for a reward
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, rewardId } = body

    if (!customerId || !rewardId) {
      return NextResponse.json(
        { error: 'customerId and rewardId are required' },
        { status: 400 }
      )
    }

    // Get the reward
    const reward = await db.pointsReward.findUnique({
      where: { id: rewardId },
    })

    if (!reward || !reward.isActive) {
      return NextResponse.json(
        { error: 'Reward not found or inactive' },
        { status: 404 }
      )
    }

    // Check availability
    if (reward.quantityAvailable !== null && reward.quantityClaimed >= reward.quantityAvailable) {
      return NextResponse.json(
        { error: 'Reward is sold out' },
        { status: 400 }
      )
    }

    // Check customer limit
    if (reward.perCustomerLimit) {
      const customerRedemptions = await db.pointsRedemption.count({
        where: {
          customerId,
          rewardId,
          status: { not: 'cancelled' },
        },
      })
      if (customerRedemptions >= reward.perCustomerLimit) {
        return NextResponse.json(
          { error: 'You have reached the redemption limit for this reward' },
          { status: 400 }
        )
      }
    }

    // Check tier requirement
    if (reward.minTierId) {
      const progress = await db.customerVIPProgress.findUnique({
        where: { customerId },
        include: { currentTier: true },
      })
      const requiredTier = await db.vIPTier.findUnique({
        where: { id: reward.minTierId },
      })
      if (progress?.currentTier && requiredTier) {
        if (progress.currentTier.level < requiredTier.level) {
          return NextResponse.json(
            { error: `This reward requires ${requiredTier.name} tier` },
            { status: 400 }
          )
        }
      }
    }

    // Check customer's points balance
    const loyaltyAccount = await db.loyaltyAccount.findUnique({
      where: { customerId },
    })

    if (!loyaltyAccount || loyaltyAccount.points < reward.pointsCost) {
      return NextResponse.json(
        { error: 'Insufficient points balance', 
          currentPoints: loyaltyAccount?.points || 0,
          requiredPoints: reward.pointsCost },
        { status: 400 }
      )
    }

    // Generate redemption code/value based on type
    let discountCode: string | null = null
    let giftCardCode: string | null = null

    if (reward.type === 'discount') {
      // Generate a unique discount code
      discountCode = `CAL${nanoid(8).toUpperCase()}`
      
      // Create a promotion for this discount
      await db.promotion.create({
        data: {
          code: discountCode,
          name: `Points Redemption: ${reward.name}`,
          description: `Discount code redeemed with ${reward.pointsCost} points`,
          type: reward.discountPercent ? 'percentage' : 'fixed',
          value: reward.discountPercent || reward.discountCents || 0,
          minOrderCents: 0,
          isActive: true,
          startsAt: new Date(),
          endsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
          usageLimit: 1,
        },
      })
    } else if (reward.type === 'gift_card') {
      // Generate a gift card
      giftCardCode = nanoid(12).toUpperCase()
      
      await db.giftCard.create({
        data: {
          code: giftCardCode,
          initialValueCents: reward.giftCardValue || 0,
          balanceCents: reward.giftCardValue || 0,
          recipientEmail: '', // Will be filled by customer
          orderId: null,
        },
      })
    }

    // Deduct points
    await db.loyaltyAccount.update({
      where: { customerId },
      data: {
        points: { decrement: reward.pointsCost },
        totalUsed: { increment: reward.pointsCost },
      },
    })

    // Create loyalty transaction
    await db.loyaltyTransaction.create({
      data: {
        accountId: loyaltyAccount.id,
        points: -reward.pointsCost,
        type: 'redemption',
        description: `Redeemed for: ${reward.name}`,
      },
    })

    // Create redemption record
    const redemption = await db.pointsRedemption.create({
      data: {
        customerId,
        rewardId,
        pointsUsed: reward.pointsCost,
        discountCode,
        giftCardCode,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      },
      include: {
        reward: true,
      },
    })

    // Update reward claim count
    await db.pointsReward.update({
      where: { id: rewardId },
      data: { quantityClaimed: { increment: 1 } },
    })

    return NextResponse.json({
      redemption,
      newPointsBalance: loyaltyAccount.points - reward.pointsCost,
    })
  } catch (error) {
    console.error('Error redeeming points:', error)
    return NextResponse.json(
      { error: 'Failed to redeem points' },
      { status: 500 }
    )
  }
}
