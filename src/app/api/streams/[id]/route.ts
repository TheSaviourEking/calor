import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/streams/[id] - Get stream details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const stream = await db.liveStream.findUnique({
      where: { id },
      include: {
        host: {
          select: {
            id: true,
            displayName: true,
            bio: true,
            avatar: true,
            isVerified: true,
            isLive: true,
            totalStreams: true,
            averageRating: true,
          },
        },
        products: {
          orderBy: [{ isPinned: 'desc' }, { sortOrder: 'asc' }],
          include: {
            product: {
              include: {
                images: { orderBy: { sortOrder: 'asc' } },
                variants: true,
                category: { select: { name: true, slug: true } },
              },
            },
          },
        },
        offers: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            viewers: true,
            messages: { where: { isDeleted: false } },
            reminders: true,
          },
        },
      },
    })

    if (!stream) {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 })
    }

    // Get current viewer count for live streams
    let viewerCount = 0
    if (stream.status === 'live') {
      viewerCount = await db.streamViewer.count({
        where: { streamId: id, leftAt: null },
      })
    }

    return NextResponse.json({
      stream,
      viewerCount,
    })
  } catch (error) {
    console.error('Error fetching stream:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stream' },
      { status: 500 }
    )
  }
}

// PUT /api/streams/[id] - Update stream
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()

    const {
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
      status,
    } = body

    const stream = await db.liveStream.update({
      where: { id },
      data: {
        title,
        description,
        thumbnailUrl,
        scheduledStart: scheduledStart ? new Date(scheduledStart) : undefined,
        scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : undefined,
        isPrivate,
        password: isPrivate ? password : null,
        maxViewers,
        allowChat,
        allowQuestions,
        moderatedChat,
        category,
        tags: tags ? JSON.stringify(tags) : undefined,
        status,
      },
    })

    return NextResponse.json({ stream })
  } catch (error) {
    console.error('Error updating stream:', error)
    return NextResponse.json(
      { error: 'Failed to update stream' },
      { status: 500 }
    )
  }
}

// DELETE /api/streams/[id] - Delete/cancel stream
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Check if stream exists
    const stream = await db.liveStream.findUnique({
      where: { id },
      select: { status: true, hostId: true },
    })

    if (!stream) {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 })
    }

    // If stream is live, we should end it first
    if (stream.status === 'live') {
      return NextResponse.json(
        { error: 'Cannot delete a live stream. End it first.' },
        { status: 400 }
      )
    }

    // Cancel or delete
    await db.liveStream.update({
      where: { id },
      data: { status: 'cancelled' },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting stream:', error)
    return NextResponse.json(
      { error: 'Failed to delete stream' },
      { status: 500 }
    )
  }
}
