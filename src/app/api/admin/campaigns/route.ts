import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// Get email campaigns (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customer = await db.customer.findUnique({
      where: { id: session.customerId }
    })

    if (!customer?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}
    if (status) where.status = status

    const [campaigns, total] = await Promise.all([
      db.emailCampaign.findMany({ /* take: handled */
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { recipients: true } }
        }
      }),
      db.emailCampaign.count({ where })
    ])

    return NextResponse.json({
      campaigns,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
  }
}

// Create email campaign (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customer = await db.customer.findUnique({
      where: { id: session.customerId }
    })

    if (!customer?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      subject,
      previewText,
      contentHtml,
      contentText,
      targetSegment,
      targetFilters,
      scheduledFor,
      trackingEnabled,
      utmSource,
      utmMedium,
      utmCampaign
    } = body

    if (!name || !subject || !contentHtml) {
      return NextResponse.json({ error: 'Name, subject, and content are required' }, { status: 400 })
    }

    // Calculate recipient count based on segment
    let recipientCount = 0
    if (targetSegment === 'all') {
      recipientCount = await db.customer.count()
    } else if (targetSegment === 'newsletter') {
      recipientCount = await db.newsletterSubscriber.count()
    } else if (targetSegment === 'customers') {
      recipientCount = await db.customer.count({
        where: { orders: { some: {} } }
      })
    }

    const campaign = await db.emailCampaign.create({
      data: {
        name,
        subject,
        previewText,
        contentHtml,
        contentText,
        targetSegment: targetSegment || 'all',
        targetFilters: targetFilters ? JSON.stringify(targetFilters) : null,
        recipientCount,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        status: scheduledFor ? 'scheduled' : 'draft',
        trackingEnabled: trackingEnabled ?? true,
        utmSource,
        utmMedium,
        utmCampaign,
        createdBy: session.customerId
      }
    })

    return NextResponse.json({ success: true, campaign })
  } catch (error) {
    console.error('Error creating campaign:', error)
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }
}

// Update campaign (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customer = await db.customer.findUnique({
      where: { id: session.customerId }
    })

    if (!customer?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 })
    }

    // Check if campaign can be updated
    const existing = await db.emailCampaign.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (existing.status === 'sent') {
      return NextResponse.json({ error: 'Cannot update sent campaign' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = { ...updates }
    if (updates.scheduledFor) {
      updateData.scheduledFor = new Date(updates.scheduledFor)
      updateData.status = 'scheduled'
    }
    if (updates.targetFilters) {
      updateData.targetFilters = JSON.stringify(updates.targetFilters)
    }

    const campaign = await db.emailCampaign.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ success: true, campaign })
  } catch (error) {
    console.error('Error updating campaign:', error)
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 })
  }
}

// Delete campaign (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customer = await db.customer.findUnique({
      where: { id: session.customerId }
    })

    if (!customer?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 })
    }

    const existing = await db.emailCampaign.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (existing.status === 'sending') {
      return NextResponse.json({ error: 'Cannot delete campaign that is being sent' }, { status: 400 })
    }

    // Delete recipients first
    await db.campaignRecipient.deleteMany({ where: { campaignId: id } })
    
    // Delete campaign
    await db.emailCampaign.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Campaign deleted' })
  } catch (error) {
    console.error('Error deleting campaign:', error)
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 })
  }
}
