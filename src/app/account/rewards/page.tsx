import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import RewardsClient from './RewardsClient'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { serialise } from '@/lib/serialise'

export const metadata: Metadata = {
  title: 'Rewards Store | CALŌR',
  description: 'Redeem your loyalty points for exclusive rewards',
}

export default async function RewardsPage() {
  const session = await getSession()

  if (!session?.customerId) {
    redirect('/account?redirect=/account/rewards')
  }

  const customerId = session.customerId

  // Fetch points balance
  const loyaltyAccount = await db.loyaltyAccount.findUnique({
    where: { customerId },
    select: { points: true }
  })
  const initialPointsBalance = loyaltyAccount?.points || 0

  // Fetch rewards
  const now = new Date()
  const rewards = await db.pointsReward.findMany({
    take: 50,
    where: {
      isActive: true,
      OR: [
        { availableFrom: null },
        { availableFrom: { lte: now } },
      ],
      AND: [
        { OR: [{ availableUntil: null }, { availableUntil: { gte: now } }] }
      ]
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
      let unavailableReason: string | null = null

      if (reward.quantityAvailable !== null && reward.quantityClaimed >= reward.quantityAvailable) {
        available = false
        unavailableReason = 'Sold out'
      }

      if (reward.perCustomerLimit) {
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

  return (
    <RewardsClient
      initialRewards={serialise(rewardsWithAvailability as any)}
      initialPointsBalance={initialPointsBalance}
    />
  )
}
