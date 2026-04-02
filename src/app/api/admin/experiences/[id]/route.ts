import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { adminApiHandler } from '@/lib/admin/middleware'

interface RouteParams {
  params: Promise<{ id: string }>
}

// PATCH /api/admin/experiences/[id] - Approve/reject/feature an experience
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  return adminApiHandler(request, async () => {
    try {
      const { id } = await params
      const body = await request.json()
      const { isApproved, isFeatured, isPublic } = body

      const experience = await db.productExperience.findUnique({ where: { id } })
      if (!experience) {
        return NextResponse.json({ error: 'Experience not found' }, { status: 404 })
      }

      const updateData: Record<string, unknown> = {}
      if (typeof isApproved === 'boolean') updateData.isApproved = isApproved
      if (typeof isFeatured === 'boolean') updateData.isFeatured = isFeatured
      if (typeof isPublic === 'boolean') updateData.isPublic = isPublic

      const updated = await db.productExperience.update({
        where: { id },
        data: updateData,
        include: {
          product: { select: { id: true, name: true } },
          customer: { select: { id: true, firstName: true, lastName: true } },
        },
      })

      return NextResponse.json({ experience: updated })
    } catch (error) {
      console.error('Experience update error:', error)
      return NextResponse.json(
        { error: 'Failed to update experience' },
        { status: 500 }
      )
    }
  })
}

// DELETE /api/admin/experiences/[id] - Delete an experience
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  return adminApiHandler(request, async () => {
    try {
      const { id } = await params
      await db.productExperience.delete({ where: { id } })
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Experience delete error:', error)
      return NextResponse.json(
        { error: 'Failed to delete experience' },
        { status: 500 }
      )
    }
  })
}
