import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/wellness/couple-goals - Get couple goals
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const couplesLinkId = searchParams.get('couplesLinkId')
    const customerId = searchParams.get('customerId')

    // If customerId provided, find their couples link
    let coupleLink = null
    if (customerId && !couplesLinkId) {
      coupleLink = await db.couplesLink.findFirst({
        where: {
          OR: [
            { customer1Id: customerId },
            { customer2Id: customerId },
          ],
          status: 'active',
        },
      })
    }

    const where: Record<string, unknown> = {}
    if (couplesLinkId) {
      where.couplesLinkId = couplesLinkId
    } else if (coupleLink) {
      where.couplesLinkId = coupleLink.id
    } else {
      return NextResponse.json({ goals: [], count: 0 })
    }

    const goals = await db.coupleGoal.findMany({
      where,
      orderBy: [{ completed: 'asc' }, { createdAt: 'desc' }],
      include: {
        milestones: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    return NextResponse.json({
      goals,
      count: goals.length,
      completedCount: goals.filter(g => g.completed).length,
    })
  } catch (error) {
    console.error('Error fetching couple goals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch couple goals' },
      { status: 500 }
    )
  }
}

// POST /api/wellness/couple-goals - Create a couple goal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      couplesLinkId,
      customerId,
      title,
      description,
      icon,
      category,
      targetDate,
      isRecurring,
      recurrence,
      pointsReward,
    } = body

    if (!title || !category) {
      return NextResponse.json(
        { error: 'Title and category are required' },
        { status: 400 }
      )
    }

    // Find couples link if only customerId provided
    let actualCouplesLinkId = couplesLinkId
    if (!actualCouplesLinkId && customerId) {
      const coupleLink = await db.couplesLink.findFirst({
        where: {
          OR: [
            { customer1Id: customerId },
            { customer2Id: customerId },
          ],
          status: 'active',
        },
      })
      if (!coupleLink) {
        return NextResponse.json(
          { error: 'No active couple link found' },
          { status: 400 }
        )
      }
      actualCouplesLinkId = coupleLink.id
    }

    if (!actualCouplesLinkId) {
      return NextResponse.json(
        { error: 'couplesLinkId or customerId is required' },
        { status: 400 }
      )
    }

    const goal = await db.coupleGoal.create({
      data: {
        couplesLinkId: actualCouplesLinkId,
        title,
        description,
        icon: icon || '💕',
        category,
        targetDate: targetDate ? new Date(targetDate) : null,
        isRecurring: isRecurring || false,
        recurrence,
        pointsReward: pointsReward || 0,
        createdBy: customerId || '',
      },
    })

    return NextResponse.json({ goal }, { status: 201 })
  } catch (error) {
    console.error('Error creating couple goal:', error)
    return NextResponse.json(
      { error: 'Failed to create couple goal' },
      { status: 500 }
    )
  }
}

// PUT /api/wellness/couple-goals - Update goal progress
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { goalId, progress, completed } = body

    if (!goalId) {
      return NextResponse.json(
        { error: 'goalId is required' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (progress !== undefined) {
      updateData.progress = Math.min(100, Math.max(0, progress))
    }
    if (completed !== undefined) {
      updateData.completed = completed
      if (completed) {
        updateData.completedAt = new Date()
      }
    }

    const goal = await db.coupleGoal.update({
      where: { id: goalId },
      data: updateData,
    })

    // Award points if goal completed
    if (completed && goal.pointsReward > 0) {
      const coupleLink = await db.couplesLink.findUnique({
        where: { id: goal.couplesLinkId },
      })

      if (coupleLink) {
        // Award points to both partners
        for (const partnerId of [coupleLink.customer1Id, coupleLink.customer2Id]) {
          const loyaltyAccount = await db.loyaltyAccount.upsert({
            where: { customerId: partnerId },
            create: {
              customerId: partnerId,
              points: goal.pointsReward,
              totalEarned: goal.pointsReward,
            },
            update: {
              points: { increment: goal.pointsReward },
              totalEarned: { increment: goal.pointsReward },
            },
          })

          await db.loyaltyTransaction.create({
            data: {
              accountId: loyaltyAccount.id,
              points: goal.pointsReward,
              type: 'bonus',
              description: `Couple goal completed: ${goal.title}`,
            },
          })
        }
      }
    }

    return NextResponse.json({ goal })
  } catch (error) {
    console.error('Error updating couple goal:', error)
    return NextResponse.json(
      { error: 'Failed to update couple goal' },
      { status: 500 }
    )
  }
}
