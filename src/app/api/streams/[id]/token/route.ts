import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { AccessToken } from 'livekit-server-sdk'
import { db } from '@/lib/db'
import { config } from '@/lib/config'
import { requireStreamOwner } from '@/lib/auth/guards'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const role = body?.role === 'host' ? 'host' : 'viewer'

    // The identity is chosen here, never by the client
    let identity: string

    if (role === 'host') {
      // Only the stream's own host (or an admin) may publish
      const auth = await requireStreamOwner(id)
      if (!auth.ok) return auth.response
      identity = `host-${auth.customerId}`
    } else {
      const stream = await db.liveStream.findUnique({ where: { id }, select: { id: true } })
      if (!stream) {
        return NextResponse.json({ error: 'Stream not found' }, { status: 404 })
      }
      // Random only: the identity is visible to everyone in the room
      identity = `viewer-${randomBytes(8).toString('hex')}`
    }

    const roomName = `stream-${id}`
    const token = new AccessToken(config.livekit.apiKey, config.livekit.apiSecret, {
      identity,
      ttl: '4h',
    })

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: role === 'host',
      canSubscribe: true,
    })

    const jwt = await token.toJwt()

    return NextResponse.json({
      token: jwt,
      wsUrl: config.livekit.wsUrl,
    })
  } catch (error) {
    console.error('Token generation error:', error)
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 })
  }
}
