import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/wellness/sessions - Get toy sessions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId is required' },
        { status: 400 }
      )
    }

    const sessions = await db.toySession.findMany({ /* take: handled */
      where: { customerId },
      include: {
        smartToy: {
          include: {
            toyModel: {
              include: { brand: true },
            },
          },
        },
        pattern: true,
      },
      orderBy: { startedAt: 'desc' },
      take: limit,
      skip: offset,
    })

    // Get total count
    const totalCount = await db.toySession.count({
      where: { customerId },
    })

    // Get stats
    const stats = await db.toySession.aggregate({
      where: { customerId, endedAt: { not: null } },
      _sum: { duration: true },
      _avg: { avgIntensity: true },
      _count: true,
    })

    // Get partner sessions
    const partnerSessions = await db.toySession.count({
      where: { 
        customerId, 
        partnerId: { not: null },
      },
    })

    return NextResponse.json({
      sessions,
      stats: {
        totalSessions: stats._count,
        totalDuration: stats._sum.duration || 0,
        avgIntensity: stats._avg.avgIntensity || 0,
        partnerSessions,
      },
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

// POST /api/wellness/sessions - Start a new session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customerId,
      smartToyId,
      patternId,
      partnerId,
      isRemoteControl,
      challengeCompletionId,
    } = body

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId is required' },
        { status: 400 }
      )
    }

    // Verify toy belongs to user if provided
    if (smartToyId) {
      const toy = await db.customerSmartToy.findFirst({
        where: { id: smartToyId, customerId },
      })

      if (!toy) {
        return NextResponse.json(
          { error: 'Toy not found or not owned by user' },
          { status: 404 }
        )
      }

      // Update toy's last connected and connection count
      await db.customerSmartToy.update({
        where: { id: smartToyId },
        data: {
          lastConnected: new Date(),
          connectionCount: { increment: 1 },
        },
      })
    }

    // Verify partner is linked if provided
    if (partnerId) {
      const coupleLink = await db.couplesLink.findFirst({
        where: {
          OR: [
            { customer1Id: customerId, customer2Id: partnerId },
            { customer2Id: customerId, customer1Id: partnerId },
          ],
          status: 'active',
        },
      })

      if (!coupleLink) {
        return NextResponse.json(
          { error: 'Partner not linked' },
          { status: 400 }
        )
      }
    }

    const session = await db.toySession.create({
      data: {
        customerId,
        smartToyId,
        patternId,
        partnerId,
        isRemoteControl: isRemoteControl || false,
        challengeCompletionId,
      },
      include: {
        smartToy: {
          include: {
            toyModel: {
              include: { brand: true },
            },
          },
        },
        pattern: true,
      },
    })

    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}

// PUT /api/wellness/sessions - End/update session
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      sessionId,
      duration,
      avgIntensity,
      peakIntensity,
      patternChanges,
    } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {
      endedAt: new Date(),
    }

    if (duration !== undefined) updateData.duration = duration
    if (avgIntensity !== undefined) updateData.avgIntensity = avgIntensity
    if (peakIntensity !== undefined) updateData.peakIntensity = peakIntensity
    if (patternChanges !== undefined) updateData.patternChanges = patternChanges

    const session = await db.toySession.update({
      where: { id: sessionId },
      data: updateData,
    })

    // Update toy's total session time
    if (session.smartToyId && duration) {
      await db.customerSmartToy.update({
        where: { id: session.smartToyId },
        data: {
          totalSessionTime: { increment: Math.floor(duration / 60) }, // Convert to minutes
        },
      })
    }

    // Award points for session completion
    if (session.customerId && duration && duration >= 60) {
      const pointsEarned = Math.min(50, Math.floor(duration / 60) * 5) // 5 points per minute, max 50

      const loyaltyAccount = await db.loyaltyAccount.upsert({
        where: { customerId: session.customerId },
        create: {
          customerId: session.customerId,
          points: pointsEarned,
          totalEarned: pointsEarned,
        },
        update: {
          points: { increment: pointsEarned },
          totalEarned: { increment: pointsEarned },
        },
      })

      await db.loyaltyTransaction.create({
        data: {
          accountId: loyaltyAccount.id,
          points: pointsEarned,
          type: 'bonus',
          description: 'Wellness session completed',
        },
      })
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error('Error updating session:', error)
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    )
  }
}
