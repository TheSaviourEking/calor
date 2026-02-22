import { redirect } from 'next/navigation'
import VIPClient from './VIPClient'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { serialise } from '@/lib/serialise'

export default async function VIPPage() {
  const session = await getSession()

  if (!session?.customerId) {
    redirect('/account?redirect=/account/vip')
  }

  const customerId = session.customerId

  // Get or create VIP progress
  let progress = await db.customerVIPProgress.findUnique({
    where: { customerId },
    include: {
      currentTier: {
        include: {
          benefits: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        },
      },
    },
  })

  if (!progress) {
    // Get the default (bronze) tier
    const bronzeTier = await db.vIPTier.findFirst({
      where: { level: 0, isActive: true },
      include: {
        benefits: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      },
    })

    progress = await db.customerVIPProgress.create({
      data: {
        customerId,
        currentTierId: bronzeTier?.id || null,
        lifetimePoints: 0,
        lifetimeSpent: 0,
      },
      include: {
        currentTier: {
          include: {
            benefits: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    })
  }

  // Get all tiers to calculate progress to next level
  const allTiers = await db.vIPTier.findMany({
    where: { isActive: true },
    orderBy: { level: 'asc' },
  })

  // Find next tier
  const currentLevel = progress.currentTier?.level ?? -1
  const nextTier = allTiers.find(t => t.level === currentLevel + 1) || null

  // Calculate progress percentage
  let progressPercentage = 100
  let pointsToNextTier = 0

  if (nextTier) {
    const currentTierThreshold = progress.currentTier?.minPoints || 0
    const nextTierThreshold = nextTier.minPoints
    pointsToNextTier = Math.max(0, nextTierThreshold - progress.lifetimePoints)

    const pointsInCurrentLevel = progress.lifetimePoints - currentTierThreshold
    const pointsNeededForNext = nextTierThreshold - currentTierThreshold
    progressPercentage = Math.min(100, Math.round((pointsInCurrentLevel / pointsNeededForNext) * 100))
  }

  const vipData = {
    progress,
    nextTier,
    pointsToNextTier,
    progressPercentage,
    allTiers,
  }

  return <VIPClient initialData={serialise(vipData)} />
}
