import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/wellness/challenges/[id] - Get challenge details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    const challenge = await db.challenge.findUnique({
      where: { id },
      include: {
        completions: customerId
          ? {
              where: { customerId },
            }
          : false,
      },
    })

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    return NextResponse.json({ challenge })
  } catch (error) {
    console.error('Error fetching challenge:', error)
    return NextResponse.json(
      { error: 'Failed to fetch challenge' },
      { status: 500 }
    )
  }
}

// POST /api/wellness/challenges/[id] - Complete/progress challenge
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const { customerId, progress } = body

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId is required' },
        { status: 400 }
      )
    }

    const challenge = await db.challenge.findUnique({
      where: { id },
    })

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    // Check if already completed
    const existing = await db.challengeCompletion.findUnique({
      where: {
        challengeId_customerId: { challengeId: id, customerId },
      },
    })

    if (existing?.completed) {
      return NextResponse.json(
        { error: 'Challenge already completed' },
        { status: 400 }
      )
    }

    const newProgress = (existing?.progress || 0) + (progress || 1)
    const isCompleted = newProgress >= challenge.requirementValue

    // Create or update completion
    const completion = await db.challengeCompletion.upsert({
      where: {
        challengeId_customerId: { challengeId: id, customerId },
      },
      create: {
        challengeId: id,
        customerId,
        progress: newProgress,
        completed: isCompleted,
        completedAt: isCompleted ? new Date() : null,
        pointsEarned: isCompleted ? challenge.points : 0,
      },
      update: {
        progress: newProgress,
        completed: isCompleted,
        completedAt: isCompleted ? new Date() : null,
        pointsEarned: isCompleted ? challenge.points : 0,
      },
    })

    // If completed, update challenge stats and award points
    if (isCompleted && !existing?.completed) {
      await Promise.all([
        db.challenge.update({
          where: { id },
          data: { completionCount: { increment: 1 } },
        }),
        db.loyaltyAccount.upsert({
          where: { customerId },
          create: {
            customerId,
            points: challenge.points,
            totalEarned: challenge.points,
          },
          update: {
            points: { increment: challenge.points },
            totalEarned: { increment: challenge.points },
          },
        }),
        db.loyaltyTransaction.create({
          data: {
            accountId: (await db.loyaltyAccount.findUnique({
              where: { customerId },
            }))!.id,
            points: challenge.points,
            type: 'bonus',
            description: `Completed challenge: ${challenge.title}`,
          },
        }),
      ])
    }

    return NextResponse.json({
      completion,
      isCompleted,
      pointsEarned: isCompleted ? challenge.points : 0,
    })
  } catch (error) {
    console.error('Error completing challenge:', error)
    return NextResponse.json(
      { error: 'Failed to complete challenge' },
      { status: 500 }
    )
  }
}
