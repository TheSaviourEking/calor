import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'
import { randomBytes } from 'crypto'

// GET /api/streams - List streams with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const hostId = searchParams.get('hostId')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }

    if (hostId) {
      where.hostId = hostId
    }

    if (category) {
      where.category = category
    }

    // For public view, only show scheduled, live, or ended streams
    if (!status) {
      where.status = { in: ['scheduled', 'live', 'ended'] }
      where.isPrivate = false
    }

    const [streams, total] = await Promise.all([
      db.liveStream.findMany({ /* take: handled */
        where,
        include: {
          host: {
            select: {
              id: true,
              displayName: true,
              avatar: true,
              isVerified: true,
              isLive: true,
            },
          },
          products: {
            take: 3,
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
          _count: {
            select: {
              viewers: true,
              products: true,
            },
          },
        },
        orderBy: [
          { status: 'asc' }, // live first, then scheduled, then ended
          { scheduledStart: 'desc' },
        ],
        take: limit,
        skip: offset,
      }),
      db.liveStream.count({ where }),
    ])

    return NextResponse.json({
      streams,
      total,
      hasMore: offset + limit < total,
    })
  } catch (error) {
    console.error('Error fetching streams:', error)
    return NextResponse.json(
      { error: 'Failed to fetch streams' },
      { status: 500 }
    )
  }
}

// POST /api/streams - Create a new stream (host/admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      hostId,
      title,
      description,
      thumbnailUrl,
      scheduledStart,
      scheduledEnd,
      isPrivate,
      password,
      maxViewers,
      allowChat,
      allowQuestions,
      moderatedChat,
      category,
      tags,
      productIds,
    } = body

    // Validate required fields
    if (!hostId || !title || !scheduledStart) {
      return NextResponse.json(
        { error: 'Missing required fields: hostId, title, scheduledStart' },
        { status: 400 }
      )
    }

    // Generate unique stream key
    const streamKey = `live_${randomBytes(16).toString('hex')}_${nanoid(8)}`

    // Create stream
    const stream = await db.liveStream.create({
      data: {
        hostId,
        title,
        description,
        thumbnailUrl,
        streamKey,
        scheduledStart: new Date(scheduledStart),
        scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null,
        isPrivate: isPrivate || false,
        password: isPrivate ? password : null,
        maxViewers,
        allowChat: allowChat ?? true,
        allowQuestions: allowQuestions ?? true,
        moderatedChat: moderatedChat || false,
        category,
        tags: tags ? JSON.stringify(tags) : null,
        products: productIds
          ? {
              create: productIds.map((productId: string, index: number) => ({
                productId,
                sortOrder: index,
              })),
            }
          : undefined,
      },
      include: {
        host: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
          },
        },
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    })

    // Update host stats
    await db.streamHost.update({
      where: { id: hostId },
      data: {
        totalStreams: { increment: 1 },
      },
    })

    return NextResponse.json({ stream }, { status: 201 })
  } catch (error) {
    console.error('Error creating stream:', error)
    return NextResponse.json(
      { error: 'Failed to create stream' },
      { status: 500 }
    )
  }
}
