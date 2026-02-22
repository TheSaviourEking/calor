import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/streams/[id]/start - Go live
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

    if (stream.status === 'live') {
      return NextResponse.json({ error: 'Stream is already live' }, { status: 400 })
    }

    if (stream.status === 'ended' || stream.status === 'cancelled') {
      return NextResponse.json({ error: 'Cannot start an ended/cancelled stream' }, { status: 400 })
    }

    // Update stream status
    const updatedStream = await db.liveStream.update({
      where: { id },
      data: {
        status: 'live',
        actualStart: new Date(),
      },
    })

    // Update host status
    await db.streamHost.update({
      where: { id: stream.hostId },
      data: {
        isLive: true,
        currentStreamId: id,
      },
    })

    // Create system message
    await db.streamChatMessage.create({
      data: {
        streamId: id,
        message: `🔴 ${stream.host.displayName} is now live!`,
        type: 'system',
      },
    })

    return NextResponse.json({
      success: true,
      stream: updatedStream,
      streamKey: stream.streamKey,
    })
  } catch (error) {
    console.error('Error starting stream:', error)
    return NextResponse.json(
      { error: 'Failed to start stream' },
      { status: 500 }
    )
  }
}
