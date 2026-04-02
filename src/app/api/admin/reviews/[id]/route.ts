import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { adminApiHandler } from '@/lib/admin/middleware'

interface RouteParams {
  params: Promise<{ id: string }>
}

// PATCH /api/admin/reviews/[id] - Approve/reject a review
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  return adminApiHandler(request, async () => {
    try {
      const { id } = await params
      const body = await request.json()
      const { isApproved, adminResponse } = body

      const review = await db.review.findUnique({ where: { id } })
      if (!review) {
        return NextResponse.json({ error: 'Review not found' }, { status: 404 })
      }

      const updateData: Record<string, unknown> = {}
      if (typeof isApproved === 'boolean') updateData.isApproved = isApproved
      if (adminResponse !== undefined) {
        updateData.adminResponse = adminResponse
        updateData.adminResponseAt = new Date()
      }

      const updated = await db.review.update({
        where: { id },
        data: updateData,
        include: {
          product: { select: { id: true, name: true } },
          customer: { select: { id: true, firstName: true, lastName: true } },
        },
      })

      return NextResponse.json({ review: updated })
    } catch (error) {
      console.error('Review update error:', error)
      return NextResponse.json(
        { error: 'Failed to update review' },
        { status: 500 }
      )
    }
  })
}

// DELETE /api/admin/reviews/[id] - Delete a review
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  return adminApiHandler(request, async () => {
    try {
      const { id } = await params
      await db.review.delete({ where: { id } })
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Review delete error:', error)
      return NextResponse.json(
        { error: 'Failed to delete review' },
        { status: 500 }
      )
    }
  })
}
