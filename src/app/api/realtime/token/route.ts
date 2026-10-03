import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { signRealtimeToken } from '../../../../../mini-services/realtime-token'

export const dynamic = 'force-dynamic'

const NO_STORE = { headers: { 'Cache-Control': 'private, no-store' } }

// GET /api/realtime/token - short-lived identity token for the socket services.
// Anonymous visitors get { token: null } and connect as guests.
export async function GET() {
  try {
    const secret = process.env.REALTIME_TOKEN_SECRET
    const session = await getSession()

    if (!secret || !session?.customerId) {
      return NextResponse.json({ token: null }, NO_STORE)
    }

    const customer = await db.customer.findUnique({
      where: { id: session.customerId },
      select: { id: true, isAdmin: true, hostProfile: { select: { id: true } } },
    })
    if (!customer) {
      return NextResponse.json({ token: null }, NO_STORE)
    }

    const token = await signRealtimeToken(
      { customerId: customer.id, isAdmin: customer.isAdmin, hostId: customer.hostProfile?.id ?? null },
      secret
    )

    return NextResponse.json({ token }, NO_STORE)
  } catch (error) {
    console.error('Realtime token error:', error)
    return NextResponse.json({ token: null }, NO_STORE)
  }
}
