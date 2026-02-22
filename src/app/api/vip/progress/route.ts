import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/vip/progress - Get customer's VIP progress
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
    const nextTier = allTiers.find(t => t.level === currentLevel + 1)

    // Calculate progress percentage
    let progressPercentage = 100
    let pointsToNextTier = 0

    if (nextTier) {
      const currentTierThreshold = progress.currentTier?.minPoints || 0
      const nextTierThreshold = nextTier.minPoints
      pointsToNextTier = nextTierThreshold - progress.lifetimePoints

      const pointsInCurrentLevel = progress.lifetimePoints - currentTierThreshold
      const pointsNeededForNext = nextTierThreshold - currentTierThreshold
      progressPercentage = Math.min(100, Math.round((pointsInCurrentLevel / pointsNeededForNext) * 100))
    }

    return NextResponse.json({
      progress,
      nextTier,
      pointsToNextTier: Math.max(0, pointsToNextTier),
      progressPercentage,
      allTiers,
    })
  } catch (error) {
    console.error('Error fetching VIP progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch VIP progress' },
      { status: 500 }
    )
  }
}

// PUT /api/vip/progress - Update VIP progress (called after order)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, pointsEarned, amountSpent } = body

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId is required' },
        { status: 400 }
      )
    }

    // Get current progress
    let progress = await db.customerVIPProgress.findUnique({
      where: { customerId },
    })

    if (!progress) {
      const bronzeTier = await db.vIPTier.findFirst({
        where: { level: 0, isActive: true },
      })

      progress = await db.customerVIPProgress.create({
        data: {
          customerId,
          currentTierId: bronzeTier?.id || null,
          lifetimePoints: 0,
          lifetimeSpent: 0,
        },
      })
    }

    // Update points and spending
    const newLifetimePoints = progress.lifetimePoints + (pointsEarned || 0)
    const newLifetimeSpent = progress.lifetimeSpent + (amountSpent || 0)

    // Check for tier upgrade
    const allTiers = await db.vIPTier.findMany({
      where: { isActive: true },
      orderBy: { level: 'asc' },
    })

    let newTier = progress.currentTierId
    for (const tier of allTiers) {
      if (newLifetimePoints >= tier.minPoints && newLifetimeSpent >= tier.minSpent) {
        const currentTierData = allTiers.find(t => t.id === newTier)
        if (!newTier || tier.level > (currentTierData?.level ?? -1)) {
          newTier = tier.id
        }
      }
    }

    // Update progress
    const updatedProgress = await db.customerVIPProgress.update({
      where: { customerId },
      data: {
        lifetimePoints: newLifetimePoints,
        lifetimeSpent: newLifetimeSpent,
        currentTierId: newTier,
        tierStartedAt: newTier !== progress.currentTierId ? new Date() : progress.tierStartedAt,
      },
      include: {
        currentTier: true,
      },
    })

    return NextResponse.json({
      progress: updatedProgress,
      tierUpgraded: newTier !== progress.currentTierId,
    })
  } catch (error) {
    console.error('Error updating VIP progress:', error)
    return NextResponse.json(
      { error: 'Failed to update VIP progress' },
      { status: 500 }
    )
  }
}
