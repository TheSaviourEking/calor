import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin/middleware'

interface RouteParams {
  params: Promise<{ id: string }>
}

// PATCH /api/admin/segments/[id] - Update a segment
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin()
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, rules, isActive } = body

    const segment = await db.customerSegment.findUnique({ where: { id } })
    if (!segment) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (rules !== undefined) updateData.rules = typeof rules === 'string' ? rules : JSON.stringify(rules)
    if (typeof isActive === 'boolean') updateData.isActive = isActive

    const updated = await db.customerSegment.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ segment: updated })
  } catch (error) {
    console.error('Error updating segment:', error)
    return NextResponse.json({ error: 'Failed to update segment' }, { status: 500 })
  }
}

// DELETE /api/admin/segments/[id] - Delete a segment
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin()
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params

    // Delete segment members first, then the segment
    await db.segmentMember.deleteMany({ where: { segmentId: id } })
    await db.customerSegment.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting segment:', error)
    return NextResponse.json({ error: 'Failed to delete segment' }, { status: 500 })
  }
}
