import { NextRequest, NextResponse } from 'next/server'
import { RoomServiceClient } from 'livekit-server-sdk'
import { db } from '@/lib/db'
import { config } from '@/lib/config'

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

    // Clean up LiveKit room
    try {
      const roomService = new RoomServiceClient(
        config.livekit.wsUrl.replace('ws://', 'http://').replace('wss://', 'https://'),
        config.livekit.apiKey,
        config.livekit.apiSecret
      )
      await roomService.deleteRoom(`stream-${id}`)
    } catch {
      // Room may not exist, ignore
    }

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
