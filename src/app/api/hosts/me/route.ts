import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

// PATCH /api/hosts/me - Update current user's host profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { displayName, bio, avatarUrl, socialLinks } = body

    const data: Record<string, unknown> = {}
    if (displayName !== undefined) data.displayName = displayName
    if (bio !== undefined) data.bio = bio
    if (avatarUrl !== undefined) data.avatar = avatarUrl
    if (socialLinks !== undefined) data.socialLinks = typeof socialLinks === 'string' ? socialLinks : JSON.stringify(socialLinks)

    const host = await db.streamHost.update({
      where: { customerId: session.customerId },
      data,
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

    return NextResponse.json({ host })
  } catch (error) {
    console.error('Error updating host profile:', error)
    return NextResponse.json(
      { error: 'Failed to update host profile' },
      { status: 500 }
    )
  }
}

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
