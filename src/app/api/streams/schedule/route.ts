import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/streams/schedule - Get upcoming scheduled streams
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const days = parseInt(searchParams.get('days') || '30')

    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + days)

    const streams = await db.liveStream.findMany({ /* take: handled */
      where: {
        status: 'scheduled',
        isPrivate: false,
        scheduledStart: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        host: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
            isVerified: true,
          },
        },
        _count: {
          select: {
            reminders: true,
            products: true,
          },
        },
      },
      orderBy: {
        scheduledStart: 'asc',
      },
      take: limit,
    })

    return NextResponse.json({
      streams,
      count: streams.length,
    })
  } catch (error) {
    console.error('Error fetching scheduled streams:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scheduled streams' },
      { status: 500 }
    )
  }
}
