import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

// GET /api/hosts/me - Get current user's host profile
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const host = await db.streamHost.findUnique({
      where: { customerId: session.customerId },
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

    if (!host) {
      return NextResponse.json({ host: null })
    }

    return NextResponse.json({ host })
  } catch (error) {
    console.error('Error fetching host profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch host profile' },
      { status: 500 }
    )
  }
}
