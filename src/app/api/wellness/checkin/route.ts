import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/wellness/checkin - Get today's check-in status
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

    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    // Get today's check-in
    const todaysCheckIn = await db.dailyCheckIn.findFirst({
      where: {
        customerId,
        checkedAt: { gte: todayStart },
      },
    })

    // Get current streak
    const streak = await db.userStreak.findUnique({
      where: { customerId },
    })

    // Get daily rewards calendar
    const dailyRewards = await db.dailyReward.findMany({ /* take: handled */
      where: { isActive: true },
      orderBy: { day: 'asc' },
    })

    const currentDayInStreak = (streak?.currentStreak || 0) + 1

    return NextResponse.json({
      checkedIn: !!todaysCheckIn,
      checkIn: todaysCheckIn,
      currentDayInStreak: Math.min(currentDayInStreak, 7), // Cycle every 7 days
      dailyRewards,
      streak,
    })
  } catch (error) {
    console.error('Error fetching check-in status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch check-in status' },
      { status: 500 }
    )
  }
}

// POST /api/wellness/checkin - Daily check-in
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId } = body

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId is required' },
        { status: 400 }
      )
    }

    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    // Check if already checked in today
    const existingCheckIn = await db.dailyCheckIn.findFirst({
      where: {
        customerId,
        checkedAt: { gte: todayStart },
      },
    })

    if (existingCheckIn) {
      return NextResponse.json(
        { error: 'Already checked in today', checkIn: existingCheckIn },
        { status: 400 }
      )
    }

    // Get current streak
    let streak = await db.userStreak.findUnique({
      where: { customerId },
    })

    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStart = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate()
    )

    let newStreak = 1
    if (streak?.lastActivityAt) {
      const lastActivity = new Date(streak.lastActivityAt)
      if (lastActivity >= yesterdayStart) {
        newStreak = streak.currentStreak + 1
      }
    }

    // Calculate day in cycle (1-7)
    const dayInStreak = ((newStreak - 1) % 7) + 1

    // Get reward for this day
    const dailyReward = await db.dailyReward.findUnique({
      where: { day: dayInStreak },
    })

    const rewardType = dailyReward?.rewardType || 'points'
    const rewardValue = dailyReward?.rewardValue || 10

    // Create check-in record
    const checkIn = await db.dailyCheckIn.create({
      data: {
        customerId,
        checkedAt: now,
        dayInStreak,
        rewardClaimed: true,
        rewardType,
        rewardValue,
      },
    })

    // Update streak
    streak = await db.userStreak.upsert({
      where: { customerId },
      create: {
        customerId,
        currentStreak: newStreak,
        longestStreak: newStreak,
        totalDays: 1,
        lastActivityAt: now,
      },
      update: {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, streak?.longestStreak || 0),
        totalDays: { increment: 1 },
        lastActivityAt: now,
      },
    })

    // Award points
    if (rewardType === 'points') {
      const loyaltyAccount = await db.loyaltyAccount.upsert({
        where: { customerId },
        create: {
          customerId,
          points: rewardValue,
          totalEarned: rewardValue,
        },
        update: {
          points: { increment: rewardValue },
          totalEarned: { increment: rewardValue },
        },
      })

      await db.loyaltyTransaction.create({
        data: {
          accountId: loyaltyAccount.id,
          points: rewardValue,
          type: 'bonus',
          description: `Daily check-in Day ${dayInStreak}`,
        },
      })
    }

    return NextResponse.json({
      checkIn,
      streak,
      reward: {
        type: rewardType,
        value: rewardValue,
      },
      newStreakRecord: newStreak === streak?.longestStreak,
    })
  } catch (error) {
    console.error('Error checking in:', error)
    return NextResponse.json(
      { error: 'Failed to check in' },
      { status: 500 }
    )
  }
}
