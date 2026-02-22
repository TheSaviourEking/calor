import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/segments - List all segments
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const segmentId = searchParams.get('id')
    const includeMembers = searchParams.get('includeMembers') === 'true'

    // Get specific segment with members
    if (segmentId) {
      const segment = await db.customerSegment.findUnique({
        where: { id: segmentId },
        include: includeMembers ? {
          members: {
            take: 100,
            include: {
              customer: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  createdAt: true,
                }
              }
            },
            orderBy: { totalSpentCents: 'desc' }
          }
        } : undefined
      })

      if (!segment) {
        return NextResponse.json({ error: 'Segment not found' }, { status: 404 })
      }

      return NextResponse.json({ segment })
    }

    // Get all segments
    const segments = await db.customerSegment.findMany({ take: 50,
      where: { isActive: true },
      orderBy: { priority: 'asc' },
      include: {
        _count: {
          select: { members: true, campaigns: true }
        }
      }
    })

    // Get total customers across all segments
    const totalSegmented = await db.segmentMember.count()
    const totalCustomers = await db.customer.count({
      where: { isAdmin: false }
    })

    return NextResponse.json({
      segments: segments.map(s => ({
        ...s,
        memberCount: s._count.members,
        campaignCount: s._count.campaigns,
      })),
      stats: {
        totalSegments: segments.length,
        totalSegmented,
        totalCustomers,
        unassigned: totalCustomers - totalSegmented,
      }
    })
  } catch (error) {
    console.error('Error fetching segments:', error)
    return NextResponse.json({ error: 'Failed to fetch segments' }, { status: 500 })
  }
}

// POST /api/admin/segments - Create new segment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      slug,
      description,
      recencyMin,
      recencyMax,
      frequencyMin,
      frequencyMax,
      monetaryMin,
      monetaryMax,
      type,
      color,
      iconName,
      priority,
      suggestedActions,
    } = body

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    const segment = await db.customerSegment.create({
      data: {
        name,
        slug,
        description,
        recencyMin: recencyMin ?? null,
        recencyMax: recencyMax ?? null,
        frequencyMin: frequencyMin ?? null,
        frequencyMax: frequencyMax ?? null,
        monetaryMin: monetaryMin ?? null,
        monetaryMax: monetaryMax ?? null,
        type: type ?? 'custom',
        color: color ?? 'terracotta',
        iconName: iconName ?? 'Users',
        priority: priority ?? 99,
        suggestedActions: suggestedActions ? JSON.stringify(suggestedActions) : null,
      }
    })

    return NextResponse.json({ segment })
  } catch (error) {
    console.error('Error creating segment:', error)
    return NextResponse.json({ error: 'Failed to create segment' }, { status: 500 })
  }
}

// PUT /api/admin/segments - Update segment
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Segment ID is required' }, { status: 400 })
    }

    // Convert monetary values from dollars to cents if provided
    if (updates.monetaryMin !== undefined) {
      updates.monetaryMin = updates.monetaryMin ? Math.round(updates.monetaryMin * 100) : null
    }
    if (updates.monetaryMax !== undefined) {
      updates.monetaryMax = updates.monetaryMax ? Math.round(updates.monetaryMax * 100) : null
    }

    if (updates.suggestedActions) {
      updates.suggestedActions = JSON.stringify(updates.suggestedActions)
    }

    const segment = await db.customerSegment.update({
      where: { id },
      data: updates,
    })

    return NextResponse.json({ segment })
  } catch (error) {
    console.error('Error updating segment:', error)
    return NextResponse.json({ error: 'Failed to update segment' }, { status: 500 })
  }
}

// DELETE /api/admin/segments - Delete segment
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Segment ID is required' }, { status: 400 })
    }

    // Delete members first
    await db.segmentMember.deleteMany({
      where: { segmentId: id }
    })

    // Delete segment
    await db.customerSegment.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting segment:', error)
    return NextResponse.json({ error: 'Failed to delete segment' }, { status: 500 })
  }
}
