import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

// Calculate tier based on total earned points
function calculateTier(totalEarned: number): string {
  if (totalEarned >= 2500) return 'platinum'
  if (totalEarned >= 1000) return 'gold'
  if (totalEarned >= 500) return 'silver'
  return 'bronze'
}

// GET - Get customer's loyalty account
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let loyaltyAccount = await db.loyaltyAccount.findUnique({
      where: { customerId: session.customerId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })

    // Create account if not exists
    if (!loyaltyAccount) {
      loyaltyAccount = await db.loyaltyAccount.create({
        data: { customerId: session.customerId },
        include: {
          transactions: true,
        },
      })
    }

    // Update tier if needed
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

    // Calculate points value (100 points = $1)
    const pointsValue = Math.floor(loyaltyAccount.points / 100)

    // Calculate progress to next tier
    const tierThresholds = [
      { tier: 'bronze', min: 0, max: 499 },
      { tier: 'silver', min: 500, max: 999 },
      { tier: 'gold', min: 1000, max: 2499 },
      { tier: 'platinum', min: 2500, max: Infinity },
    ]

    const currentTierIndex = tierThresholds.findIndex((t) => t.tier === loyaltyAccount.tier)
    const nextTier = currentTierIndex < tierThresholds.length - 1 ? tierThresholds[currentTierIndex + 1] : null

    const progressToNextTier = nextTier
      ? Math.min(((loyaltyAccount.totalEarned / nextTier.min) * 100), 100)
      : 100

    return NextResponse.json({
      account: {
        ...loyaltyAccount,
        pointsValue,
        progressToNextTier,
        nextTier: nextTier?.tier || null,
        pointsToNextTier: nextTier ? nextTier.min - loyaltyAccount.totalEarned : 0,
      },
    })
  } catch (error) {
    console.error('Error fetching loyalty account:', error)
    return NextResponse.json({ error: 'Failed to fetch loyalty account' }, { status: 500 })
  }
}
