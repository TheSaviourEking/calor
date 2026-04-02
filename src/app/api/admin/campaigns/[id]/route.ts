import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin/middleware'

interface RouteParams {
  params: Promise<{ id: string }>
}

// PATCH /api/admin/campaigns/[id] - Update a campaign
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin()
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { name, subject, content, status, scheduledAt, segmentId } = body

    const campaign = await db.emailCampaign.findUnique({ where: { id } })
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (subject !== undefined) updateData.subject = subject
    if (content !== undefined) updateData.content = content
    if (status !== undefined) updateData.status = status
    if (scheduledAt !== undefined) updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null
    if (segmentId !== undefined) updateData.segmentId = segmentId

    const updated = await db.emailCampaign.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ campaign: updated })
  } catch (error) {
    console.error('Error updating campaign:', error)
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 })
  }
}

// DELETE /api/admin/campaigns/[id] - Delete a campaign
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin()
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params

    await db.emailCampaign.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting campaign:', error)
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 })
  }
}
