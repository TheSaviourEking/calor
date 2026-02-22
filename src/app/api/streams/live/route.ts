import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/streams/live - Get currently live streams
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    const streams = await db.liveStream.findMany({ /* take: handled */
      where: {
        status: 'live',
        isPrivate: false,
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
            viewers: { where: { leftAt: null } },
          },
        },
      },
      orderBy: {
        peakViewers: 'desc',
      },
      take: limit,
    })

    // Get actual current viewer counts
    const streamsWithViewers = await Promise.all(
      streams.map(async (stream) => {
        const currentViewers = await db.streamViewer.count({
          where: { streamId: stream.id, leftAt: null },
        })
        return {
          ...stream,
          currentViewers,
        }
      })
    )

    return NextResponse.json({
      streams: streamsWithViewers,
      count: streamsWithViewers.length,
    })
  } catch (error) {
    console.error('Error fetching live streams:', error)
    return NextResponse.json(
      { error: 'Failed to fetch live streams' },
      { status: 500 }
    )
  }
}
