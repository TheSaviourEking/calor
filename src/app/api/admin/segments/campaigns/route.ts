import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/segments/campaigns - List campaigns
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const segmentId = searchParams.get('segmentId')
    const campaignId = searchParams.get('campaignId')
    const status = searchParams.get('status')

    // Get specific campaign
    if (campaignId) {
      const campaign = await db.segmentCampaign.findUnique({
        where: { id: campaignId },
        include: {
          segment: {
            select: { id: true, name: true, slug: true, customerCount: true }
          }
        }
      })

      if (!campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
      }

      return NextResponse.json({ campaign })
    }

    // Build filter
    const where: Record<string, unknown> = {}
    if (segmentId) where.segmentId = segmentId
    if (status) where.status = status

    const campaigns = await db.segmentCampaign.findMany({ /* take: handled */
      where,
      include: {
        segment: {
          select: { id: true, name: true, slug: true, customerCount: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // Get overall stats
    const totalCampaigns = await db.segmentCampaign.count()
    const sentCampaigns = await db.segmentCampaign.count({
      where: { status: 'sent' }
    })

    const totalRevenue = await db.segmentCampaign.aggregate({
      _sum: { revenueCents: true },
      where: { status: 'completed' }
    })

    return NextResponse.json({
      campaigns,
      stats: {
        totalCampaigns,
        sentCampaigns,
        totalRevenue: totalRevenue._sum.revenueCents || 0,
      }
    })
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
  }
}

// POST /api/admin/segments/campaigns - Create campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      segmentId,
      name,
      description,
      type,
      subject,
      content,
      offerCode,
      scheduledAt,
    } = body

    if (!segmentId || !name || !type) {
      return NextResponse.json({ error: 'Segment ID, name, and type are required' }, { status: 400 })
    }

    // Get segment member count
    const segment = await db.customerSegment.findUnique({
      where: { id: segmentId },
      select: { customerCount: true }
    })

    if (!segment) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 })
    }

    const campaign = await db.segmentCampaign.create({
      data: {
        segmentId,
        name,
        description,
        type,
        subject,
        content: content ? JSON.stringify(content) : null,
        offerCode,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        recipientsCount: segment.customerCount,
        status: scheduledAt ? 'scheduled' : 'draft',
      },
      include: {
        segment: {
          select: { id: true, name: true, slug: true }
        }
      }
    })

    return NextResponse.json({ campaign })
  } catch (error) {
    console.error('Error creating campaign:', error)
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }
}

// PUT /api/admin/segments/campaigns - Update campaign
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 })
    }

    // Convert content to JSON string if provided
    if (updates.content) {
      updates.content = JSON.stringify(updates.content)
    }

    // Handle date conversion
    if (updates.scheduledAt) {
      updates.scheduledAt = new Date(updates.scheduledAt)
    }

    const campaign = await db.segmentCampaign.update({
      where: { id },
      data: updates,
      include: {
        segment: {
          select: { id: true, name: true, slug: true }
        }
      }
    })

    return NextResponse.json({ campaign })
  } catch (error) {
    console.error('Error updating campaign:', error)
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 })
  }
}

// DELETE /api/admin/segments/campaigns - Delete campaign
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 })
    }

    await db.segmentCampaign.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting campaign:', error)
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 })
  }
}

// PATCH /api/admin/segments/campaigns - Send campaign
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, action } = body

    if (!id || !action) {
      return NextResponse.json({ error: 'Campaign ID and action are required' }, { status: 400 })
    }

    if (action === 'send') {
      // In a real implementation, this would trigger email sending
      // For now, we'll just mark it as sent
      const campaign = await db.segmentCampaign.update({
        where: { id },
        data: {
          status: 'sent',
          sentAt: new Date(),
        }
      })

      return NextResponse.json({ 
        campaign,
        message: 'Campaign marked as sent (actual email sending requires email service integration)'
      })
    }

    if (action === 'complete') {
      const campaign = await db.segmentCampaign.update({
        where: { id },
        data: {
          status: 'completed',
        }
      })

      return NextResponse.json({ campaign })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating campaign:', error)
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 })
  }
}
