import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/wellness/streaks - Get user streak
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

    const streak = await db.userStreak.findUnique({
      where: { customerId },
    })

    // Calculate if streak should be reset
    if (streak?.lastActivityAt) {
      const lastActivity = new Date(streak.lastActivityAt)
      const now = new Date()
      const hoursSinceLastActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60)

      // If more than 48 hours, streak is broken
      if (hoursSinceLastActivity > 48 && streak.currentStreak > 0) {
        const updatedStreak = await db.userStreak.update({
          where: { customerId },
          data: {
            currentStreak: 0,
          },
        })
        return NextResponse.json({ streak: updatedStreak, streakBroken: true })
      }
    }

    return NextResponse.json({ streak, streakBroken: false })
  } catch (error) {
    console.error('Error fetching streak:', error)
    return NextResponse.json(
      { error: 'Failed to fetch streak' },
      { status: 500 }
    )
  }
}

// POST /api/wellness/streaks - Update streak (activity)
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

    const existingStreak = await db.userStreak.findUnique({
      where: { customerId },
    })

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Check if already active today
    if (existingStreak?.lastActivityAt) {
      const lastActivity = new Date(existingStreak.lastActivityAt)
      const lastActivityDay = new Date(
        lastActivity.getFullYear(),
        lastActivity.getMonth(),
        lastActivity.getDate()
      )

      if (lastActivityDay.getTime() === today.getTime()) {
        // Already logged today
        return NextResponse.json({
          streak: existingStreak,
          alreadyLoggedToday: true,
        })
      }

      // Check if yesterday
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      if (lastActivityDay.getTime() === yesterday.getTime()) {
        // Continue streak
        const newStreak = existingStreak.currentStreak + 1
        const updatedStreak = await db.userStreak.update({
          where: { customerId },
          data: {
            currentStreak: newStreak,
            longestStreak: Math.max(newStreak, existingStreak.longestStreak),
            totalDays: { increment: 1 },
            lastActivityAt: now,
          },
        })

        // Check for streak milestones (award achievements)
        const milestones = [7, 14, 30, 60, 100, 365]
        const hitMilestone = milestones.includes(newStreak)

        return NextResponse.json({
          streak: updatedStreak,
          continued: true,
          hitMilestone,
          pointsEarned: newStreak * 5, // Points scale with streak
        })
      }
    }

    // Either new streak or broken streak - start from 1
    const streak = await db.userStreak.upsert({
      where: { customerId },
      create: {
        customerId,
        currentStreak: 1,
        longestStreak: 1,
        totalDays: 1,
        lastActivityAt: now,
      },
      update: {
        currentStreak: 1,
        lastActivityAt: now,
        totalDays: { increment: 1 },
      },
    })

    return NextResponse.json({
      streak,
      started: true,
      pointsEarned: 5,
    })
  } catch (error) {
    console.error('Error updating streak:', error)
    return NextResponse.json(
      { error: 'Failed to update streak' },
      { status: 500 }
    )
  }
}
