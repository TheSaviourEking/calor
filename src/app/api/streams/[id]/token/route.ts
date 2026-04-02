import { NextRequest, NextResponse } from 'next/server'
import { AccessToken } from 'livekit-server-sdk'
import { db } from '@/lib/db'
import { config } from '@/lib/config'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const { identity, role } = body

    if (!identity || !role) {
      return NextResponse.json({ error: 'identity and role required' }, { status: 400 })
    }

    const stream = await db.liveStream.findUnique({ where: { id } })
    if (!stream) {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 })
    }

    const roomName = `stream-${id}`
    const token = new AccessToken(config.livekit.apiKey, config.livekit.apiSecret, {
      identity,
      ttl: '4h',
    })

    if (role === 'host') {
      token.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true })
    } else {
      token.addGrant({ roomJoin: true, room: roomName, canPublish: false, canSubscribe: true })
    }

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
