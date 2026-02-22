import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/hosts - List stream hosts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const isLive = searchParams.get('isLive')

    const where: Record<string, unknown> = {}

    if (isLive === 'true') {
      where.isLive = true
    }

    const hosts = await db.streamHost.findMany({ /* take: handled */
      where,
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            streams: true,
            reviews: true,
          },
        },
      },
      orderBy: [
        { isLive: 'desc' },
        { totalViewers: 'desc' },
      ],
      take: limit,
    })

    return NextResponse.json({ hosts })
  } catch (error) {
    console.error('Error fetching hosts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hosts' },
      { status: 500 }
    )
  }
}

// POST /api/hosts - Create a new host profile (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, displayName, bio, avatar, socialLinks } = body

    if (!customerId || !displayName) {
      return NextResponse.json(
        { error: 'Missing required fields: customerId, displayName' },
        { status: 400 }
      )
    }

    // Check if customer already has a host profile
    const existing = await db.streamHost.findUnique({
      where: { customerId },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Customer already has a host profile' },
        { status: 400 }
      )
    }

    const host = await db.streamHost.create({
      data: {
        customerId,
        displayName,
        bio,
        avatar,
        socialLinks: socialLinks ? JSON.stringify(socialLinks) : null,
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ host }, { status: 201 })
  } catch (error) {
    console.error('Error creating host:', error)
    return NextResponse.json(
      { error: 'Failed to create host' },
      { status: 500 }
    )
  }
}
