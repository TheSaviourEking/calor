import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/streams/[id]/end - End stream
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const stream = await db.liveStream.findUnique({
      where: { id },
      include: { host: true },
    })

    if (!stream) {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 })
    }

    if (stream.status !== 'live') {
      return NextResponse.json({ error: 'Stream is not live' }, { status: 400 })
    }

    // Calculate final analytics
    const totalViewers = await db.streamViewer.count({
      where: { streamId: id },
    })

    const totalMessages = await db.streamChatMessage.count({
      where: { streamId: id, isDeleted: false },
    })

    // Update stream status
    const updatedStream = await db.liveStream.update({
      where: { id },
      data: {
        status: 'ended',
        actualEnd: new Date(),
        totalUniqueViewers: totalViewers,
        totalChatMessages: totalMessages,
      },
    })

    // Update host status
    await db.streamHost.update({
      where: { id: stream.hostId },
      data: {
        isLive: false,
        currentStreamId: null,
        totalViewers: { increment: totalViewers },
      },
    })

    // Mark all viewers as left
    await db.streamViewer.updateMany({
      where: { streamId: id, leftAt: null },
      data: { leftAt: new Date() },
    })

    // Create system message
    await db.streamChatMessage.create({
      data: {
        streamId: id,
        message: `Stream ended. Thank you for watching!`,
        type: 'system',
      },
    })

    return NextResponse.json({
      success: true,
      stream: updatedStream,
    })
  } catch (error) {
    console.error('Error ending stream:', error)
    return NextResponse.json(
      { error: 'Failed to end stream' },
      { status: 500 }
    )
  }
}
