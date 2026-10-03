import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireCustomer } from '@/lib/auth/guards'

// GET /api/wellness/couple-goals - Get couple goals
export async function GET(request: NextRequest) {
  try {
    const auth = await requireCustomer()
    if (!auth.ok) return auth.response
    const customerId = auth.customerId
    const { searchParams } = new URL(request.url)

    // Only a link the caller belongs to is ever used, whatever id was asked for
    const requestedLinkId = searchParams.get('couplesLinkId')
    const coupleLink = await db.couplesLink.findFirst({
      where: {
        ...(requestedLinkId && { id: requestedLinkId }),
        OR: [
          { customer1Id: customerId },
          { customer2Id: customerId },
        ],
        status: 'active',
      },
    })
    const couplesLinkId = coupleLink?.id ?? null

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
    const auth = await requireCustomer()
    if (!auth.ok) return auth.response
    const body = await request.json()
    const {
      couplesLinkId,
      title,
      description,
      icon,
      category,
      targetDate,
      isRecurring,
      recurrence,
    } = body

    if (!title || !category) {
      return NextResponse.json(
        { error: 'Title and category are required' },
        { status: 400 }
      )
    }

    // The goal always goes on a link the caller belongs to
    const coupleLink = await db.couplesLink.findFirst({
      where: {
        ...(couplesLinkId && { id: couplesLinkId }),
        OR: [
          { customer1Id: auth.customerId },
          { customer2Id: auth.customerId },
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
    const actualCouplesLinkId = coupleLink.id

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
        // Goals created through the API never carry points; a client cannot assign itself a reward
        pointsReward: 0,
        createdBy: auth.customerId,
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
    const auth = await requireCustomer()
    if (!auth.ok) return auth.response
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

    const existing = await db.coupleGoal.findFirst({
      where: {
        id: goalId,
        couplesLink: {
          status: 'active',
          OR: [
            { customer1Id: auth.customerId },
            { customer2Id: auth.customerId },
          ],
        },
      },
      select: { id: true, completed: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    if (existing.completed && completed === false) {
      return NextResponse.json(
        { error: 'A completed goal cannot be reopened' },
        { status: 409 }
      )
    }

    let goal
    let justCompleted = false
    if (completed === true) {
      // Completion is one atomic transition; only the request that flips it earns the reward
      const flipped = await db.coupleGoal.updateMany({
        where: {
          id: goalId,
          completed: false,
          couplesLink: {
            status: 'active',
            OR: [
              { customer1Id: auth.customerId },
              { customer2Id: auth.customerId },
            ],
          },
        },
        data: { ...updateData, completed: true, completedAt: new Date() },
      })
      justCompleted = flipped.count === 1
      goal = await db.coupleGoal.findUnique({ where: { id: goalId } })
    } else {
      goal = await db.coupleGoal.update({
        where: { id: goalId },
        data: updateData,
      })
    }
    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    // Award points only on the transition to completed
    if (justCompleted && goal.pointsReward > 0) {
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
