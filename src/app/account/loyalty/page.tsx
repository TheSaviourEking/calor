import { redirect } from 'next/navigation'
import LoyaltyClient from './LoyaltyClient'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { serialise } from '@/lib/serialise'

function calculateTier(totalEarned: number): string {
  if (totalEarned >= 2500) return 'platinum'
  if (totalEarned >= 1000) return 'gold'
  if (totalEarned >= 500) return 'silver'
  return 'bronze'
}

export default async function LoyaltyPage() {
  const session = await getSession()

  if (!session?.customerId) {
    redirect('/account?redirect=/account/loyalty')
  }

  const customerId = session.customerId

  let loyaltyAccount = await db.loyaltyAccount.findUnique({
    where: { customerId },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })

  if (!loyaltyAccount) {
    loyaltyAccount = await db.loyaltyAccount.create({
      data: { customerId },
      include: {
        transactions: true,
      },
    })
  }

  const correctTier = calculateTier(loyaltyAccount.totalEarned)
  if (loyaltyAccount.tier !== correctTier) {
    loyaltyAccount = await db.loyaltyAccount.update({
      where: { id: loyaltyAccount.id },
      data: { tier: correctTier },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })
  }

  const pointsValue = Math.floor(loyaltyAccount.points / 100)

  const tierThresholds = [
    { tier: 'bronze', min: 0, max: 499 },
    { tier: 'silver', min: 500, max: 999 },
    { tier: 'gold', min: 1000, max: 2499 },
    { tier: 'platinum', min: 2500, max: Infinity },
  ]

  const currentTierIndex = tierThresholds.findIndex((t) => t.tier === loyaltyAccount.tier)
  const nextTier = currentTierIndex !== -1 && currentTierIndex < tierThresholds.length - 1
    ? tierThresholds[currentTierIndex + 1]
    : null

  const progressToNextTier = nextTier
    ? Math.min(((loyaltyAccount.totalEarned / nextTier.min) * 100), 100)
    : 100

  const accountData = {
    ...loyaltyAccount,
    pointsValue,
    progressToNextTier,
    nextTier: nextTier?.tier || null,
    pointsToNextTier: nextTier ? nextTier.min - loyaltyAccount.totalEarned : 0,
  }

  return <LoyaltyClient initialAccount={serialise(accountData as any)} />
}
