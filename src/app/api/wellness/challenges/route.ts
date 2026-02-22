import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/wellness/challenges - List all active challenges
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const customerId = searchParams.get('customerId')

    const where: Record<string, unknown> = {
      isActive: true,
    }

    if (type) {
      where.type = type
    }

    if (category) {
      where.category = category
    }

    const challenges = await db.challenge.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        completions: customerId
          ? {
            where: { customerId },
            select: {
              id: true,
              progress: true,
              completed: true,
              completedAt: true,
            },
          }
          : false,
      },
    })

    // Get completion stats
    const challengesWithStats = challenges.map((challenge) => ({
      ...challenge,
      completionCount: challenge.completionCount,
      userCompletion: challenge.completions?.[0] || null,
    }))

    return NextResponse.json({
      challenges: challengesWithStats,
      count: challengesWithStats.length,
    })
  } catch (error) {
    console.error('Error fetching challenges:', error)
    return NextResponse.json(
      { error: 'Failed to fetch challenges' },
      { status: 500 }
    )
  }
}

// POST /api/wellness/challenges - Create a new challenge (admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      icon,
      type,
      category,
      requirementType,
      requirementValue,
      points,
      rewardType,
      rewardValue,
      startsAt,
      endsAt,
    } = body

    if (!title || !type || !category || !requirementType || !requirementValue) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const challenge = await db.challenge.create({
      data: {
        title,
        description,
        icon: icon || '🎯',
        type,
        category,
        requirementType,
        requirementValue,
        points: points || 10,
        rewardType: rewardType || 'points',
        rewardValue,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
      },
    })

    return NextResponse.json({ challenge }, { status: 201 })
  } catch (error) {
    console.error('Error creating challenge:', error)
    return NextResponse.json(
      { error: 'Failed to create challenge' },
      { status: 500 }
    )
  }
}
