import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireCustomer } from '@/lib/auth/guards'

// Session points a customer can earn per calendar day (server time)
const SESSION_POINTS_DAILY_CAP = 50

// GET /api/wellness/sessions - Get toy sessions
export async function GET(request: NextRequest) {
  try {
    const auth = await requireCustomer()
    if (!auth.ok) return auth.response
    const customerId = auth.customerId
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

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
    const auth = await requireCustomer()
    if (!auth.ok) return auth.response
    const customerId = auth.customerId
    const body = await request.json()
    const {
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

    // One open session at a time, so parallel sessions cannot each earn a reward
    const openSession = await db.toySession.findFirst({
      where: { customerId, endedAt: null },
      select: { id: true },
    })
    if (openSession) {
      return NextResponse.json(
        { error: 'You already have an active session' },
        { status: 409 }
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
    const auth = await requireCustomer()
    if (!auth.ok) return auth.response

    const body = await request.json()
    const {
      sessionId,
      duration: reportedDuration,
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

    // Only the owner can end a session, and only once — ending it awards points
    const open = await db.toySession.findFirst({
      where: { id: sessionId, customerId: auth.customerId, endedAt: null },
      select: { id: true, startedAt: true },
    })
    if (!open) {
      return NextResponse.json({ error: 'Session not found or already ended' }, { status: 404 })
    }

    // The client reports the duration, but it can never exceed the real elapsed time
    const elapsedSeconds = Math.floor((Date.now() - open.startedAt.getTime()) / 1000)
    const duration =
      reportedDuration === undefined
        ? undefined
        : Math.max(0, Math.min(Math.floor(Number(reportedDuration) || 0), elapsedSeconds))

    const updateData: Record<string, unknown> = {
      endedAt: new Date(),
    }

    if (duration !== undefined) updateData.duration = duration
    if (avgIntensity !== undefined) updateData.avgIntensity = avgIntensity
    if (peakIntensity !== undefined) updateData.peakIntensity = peakIntensity
    if (patternChanges !== undefined) updateData.patternChanges = patternChanges

    // End the session atomically; only the request that ends it can earn points
    const ended = await db.toySession.updateMany({
      where: { id: sessionId, customerId: auth.customerId, endedAt: null },
      data: updateData,
    })
    if (ended.count !== 1) {
      return NextResponse.json({ error: 'Session not found or already ended' }, { status: 404 })
    }

    const session = await db.toySession.findUnique({ where: { id: sessionId } })
    if (!session) {
      return NextResponse.json({ error: 'Session not found or already ended' }, { status: 404 })
    }

    // Update toy's total session time
    if (session.smartToyId && duration) {
      await db.customerSmartToy.update({
        where: { id: session.smartToyId },
        data: {
          totalSessionTime: { increment: Math.floor(duration / 60) }, // Convert to minutes
        },
      })
    }

    // Award points for session completion, within the daily cap
    if (session.customerId && duration && duration >= 60) {
      const startOfToday = new Date()
      startOfToday.setHours(0, 0, 0, 0)
      const today = await db.loyaltyTransaction.aggregate({
        where: {
          account: { customerId: session.customerId },
          type: 'bonus',
          description: 'Wellness session completed',
          createdAt: { gte: startOfToday },
        },
        _sum: { points: true },
      })
      const alreadyToday = today._sum.points ?? 0
      const pointsEarned = Math.min(
        Math.min(50, Math.floor(duration / 60) * 5), // 5 points per minute, max 50
        SESSION_POINTS_DAILY_CAP - alreadyToday
      )

      if (pointsEarned > 0) {
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
