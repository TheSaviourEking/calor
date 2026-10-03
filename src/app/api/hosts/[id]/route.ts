import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireCustomer, requireAdminUser } from '@/lib/auth/guards'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/hosts/[id] - Get host profile
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const host = await db.streamHost.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        streams: {
          where: {
            status: { in: ['live', 'scheduled', 'ended'] },
            isPrivate: false,
          },
          orderBy: { scheduledStart: 'desc' },
          take: 10,
          omit: { streamKey: true, password: true },
          include: {
            _count: {
              select: { viewers: true },
            },
          },
        },
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            customer: {
              select: { firstName: true },
            },
          },
        },
        _count: {
          select: {
            streams: true,
            reviews: true,
          },
        },
      },
    })

    if (!host) {
      return NextResponse.json({ error: 'Host not found' }, { status: 404 })
    }

    return NextResponse.json({ host })
  } catch (error) {
    console.error('Error fetching host:', error)
    return NextResponse.json(
      { error: 'Failed to fetch host' },
      { status: 500 }
    )
  }
}

// PUT /api/hosts/[id] - Update host profile
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireCustomer()
    if (!auth.ok) return auth.response

    const { id } = await params

    const target = await db.streamHost.findUnique({ where: { id }, select: { customerId: true } })
    if (!target) {
      return NextResponse.json({ error: 'Host not found' }, { status: 404 })
    }
    if (target.customerId !== auth.customerId) {
      const admin = await requireAdminUser()
      if (!admin.ok) return admin.response
    }

    const body = await request.json()

    const { displayName, bio, avatar, socialLinks, defaultStreamDays, defaultStreamTime } = body

    const host = await db.streamHost.update({
      where: { id },
      data: {
        displayName,
        bio,
        avatar,
        socialLinks: socialLinks ? JSON.stringify(socialLinks) : undefined,
        defaultStreamDays: defaultStreamDays ? JSON.stringify(defaultStreamDays) : undefined,
        defaultStreamTime,
      },
    })

    return NextResponse.json({ host })
  } catch (error) {
    console.error('Error updating host:', error)
    return NextResponse.json(
      { error: 'Failed to update host' },
      { status: 500 }
    )
  }
}
