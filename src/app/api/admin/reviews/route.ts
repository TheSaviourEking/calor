import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { adminApiHandler } from '@/lib/admin/middleware'

// GET /api/admin/reviews - List reviews with moderation filters
export async function GET(request: NextRequest) {
  return adminApiHandler(request, async () => {
    try {
      const { searchParams } = new URL(request.url)
      const status = searchParams.get('status') // 'pending' | 'approved' | 'rejected'
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')

      const where: Record<string, unknown> = {}
      if (status === 'pending') where.isApproved = false
      else if (status === 'approved') where.isApproved = true

      const [reviews, total] = await Promise.all([
        db.review.findMany({
          where,
          include: {
            product: { select: { id: true, name: true, slug: true } },
            customer: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.review.count({ where }),
      ])

      return NextResponse.json({
        reviews,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      })
    } catch (error) {
      console.error('Error fetching reviews:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      )
    }
  })
}
