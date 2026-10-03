import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireCustomer } from '@/lib/auth/guards'
import { getSession } from '@/lib/auth/session'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/wellness/challenges/[id] - Get challenge details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const customerId = (await getSession())?.customerId ?? null

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
    const auth = await requireCustomer()
    if (!auth.ok) return auth.response
    const customerId = auth.customerId
    const { id } = await params
    const body = await request.json()
    const { progress } = body

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

    // Record progress; completion is flipped separately so it can be claimed only once
    let completion = await db.challengeCompletion.upsert({
      where: {
        challengeId_customerId: { challengeId: id, customerId },
      },
      create: {
        challengeId: id,
        customerId,
        progress: newProgress,
        completed: false,
        pointsEarned: 0,
      },
      update: {
        progress: newProgress,
      },
    })

    // Atomic transition to completed: only the request that flips it awards points
    let credited = false
    if (isCompleted) {
      const flipped = await db.challengeCompletion.updateMany({
        where: { challengeId: id, customerId, completed: false },
        data: {
          completed: true,
          completedAt: new Date(),
          pointsEarned: challenge.points,
        },
      })
      credited = flipped.count === 1

      if (credited) {
        completion = {
          ...completion,
          completed: true,
          completedAt: new Date(),
          pointsEarned: challenge.points,
        }

        await db.challenge.update({
          where: { id },
          data: { completionCount: { increment: 1 } },
        })

        const loyaltyAccount = await db.loyaltyAccount.upsert({
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
        })

        await db.loyaltyTransaction.create({
          data: {
            accountId: loyaltyAccount.id,
            points: challenge.points,
            type: 'bonus',
            description: `Completed challenge: ${challenge.title}`,
          },
        })
      }
    }

    return NextResponse.json({
      completion,
      isCompleted,
      pointsEarned: credited ? challenge.points : 0,
    })
  } catch (error) {
    console.error('Error completing challenge:', error)
    return NextResponse.json(
      { error: 'Failed to complete challenge' },
      { status: 500 }
    )
  }
}
