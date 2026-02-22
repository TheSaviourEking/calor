import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/wellness/achievements - List achievements
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const category = searchParams.get('category')

    const where: Record<string, unknown> = {}
    if (category) {
      where.category = category
    }

    const achievements = await db.achievement.findMany({
      where,
      orderBy: [{ tier: 'asc' }, { sortOrder: 'asc' }],
      include: {
        userAchievements: customerId
          ? {
            where: { customerId },
          }
          : false,
      },
    })

    const achievementsWithStatus = achievements.map((achievement) => ({
      ...achievement,
      earned: achievement.userAchievements?.length > 0,
      earnedAt: achievement.userAchievements?.[0]?.earnedAt || null,
    }))

    return NextResponse.json({
      achievements: achievementsWithStatus,
      count: achievementsWithStatus.length,
      earnedCount: achievementsWithStatus.filter((a) => a.earned).length,
    })
  } catch (error) {
    console.error('Error fetching achievements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    )
  }
}

// POST /api/wellness/achievements - Create achievement (admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      slug,
      description,
      icon,
      imageUrl,
      category,
      tier,
      requirementType,
      requirementValue,
      pointsAwarded,
      unlocksFeature,
      isSecret,
    } = body

    if (!name || !slug || !requirementType || !requirementValue) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const achievement = await db.achievement.create({
      data: {
        name,
        slug,
        description: description || '',
        icon: icon || '🏆',
        imageUrl,
        category: category || 'milestone',
        tier: tier || 'bronze',
        requirementType,
        requirementValue,
        pointsAwarded: pointsAwarded || 50,
        unlocksFeature,
        isSecret: isSecret || false,
      },
    })

    return NextResponse.json({ achievement }, { status: 201 })
  } catch (error) {
    console.error('Error creating achievement:', error)
    return NextResponse.json(
      { error: 'Failed to create achievement' },
      { status: 500 }
    )
  }
}
