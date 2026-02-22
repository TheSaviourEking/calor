import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/wellness/daily-rewards - Get daily rewards
export async function GET(request: NextRequest) {
  try {
    const dailyRewards = await db.dailyReward.findMany({
      where: { isActive: true },
      orderBy: { day: 'asc' },
    })

    return NextResponse.json({ dailyRewards })
  } catch (error) {
    console.error('Error fetching daily rewards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch daily rewards' },
      { status: 500 }
    )
  }
}

// POST /api/wellness/daily-rewards - Seed daily rewards
export async function POST(request: NextRequest) {
  try {
    // Default 7-day reward cycle
    const rewards = [
      { day: 1, rewardType: 'points', rewardValue: 10 },
      { day: 2, rewardType: 'points', rewardValue: 15 },
      { day: 3, rewardType: 'points', rewardValue: 20 },
      { day: 4, rewardType: 'points', rewardValue: 25 },
      { day: 5, rewardType: 'points', rewardValue: 30 },
      { day: 6, rewardType: 'points', rewardValue: 40 },
      { day: 7, rewardType: 'points', rewardValue: 100 }, // Big weekly bonus
    ]

    const created = []
    for (const reward of rewards) {
      const dailyReward = await db.dailyReward.upsert({
        where: { day: reward.day },
        create: reward,
        update: reward,
      })
      created.push(dailyReward)
    }

    return NextResponse.json({ dailyRewards: created, message: 'Daily rewards seeded' })
  } catch (error) {
    console.error('Error seeding daily rewards:', error)
    return NextResponse.json(
      { error: 'Failed to seed daily rewards' },
      { status: 500 }
    )
  }
}
