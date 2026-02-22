import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/streams/replays - Get available replays
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const streams = await db.liveStream.findMany({ /* take: handled */
      where: {
        status: 'ended',
        replayAvailable: true,
        isPrivate: false,
        recordingUrl: { not: null },
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
        products: {
          take: 4,
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: { take: 1 },
                variants: { take: 1 },
              },
            },
          },
        },
      },
      orderBy: {
        actualEnd: 'desc',
      },
      take: limit,
      skip: offset,
    })

    return NextResponse.json({
      streams,
    })
  } catch (error) {
    console.error('Error fetching replays:', error)
    return NextResponse.json(
      { error: 'Failed to fetch replays' },
      { status: 500 }
    )
  }
}
