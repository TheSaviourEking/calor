import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { adminApiHandler } from '@/lib/admin/middleware'

// GET /api/admin/experiences - List experiences with moderation filters
export async function GET(request: NextRequest) {
  return adminApiHandler(request, async () => {
    try {
      const { searchParams } = new URL(request.url)
      const status = searchParams.get('status') // 'pending' | 'approved' | 'rejected'
      const type = searchParams.get('type') // 'story' | 'tip' | 'unboxing' | 'review'
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')

      const where: Record<string, unknown> = {}
      if (status === 'pending') where.isApproved = false
      else if (status === 'approved') where.isApproved = true
      if (type) where.experienceType = type

      const [experiences, total] = await Promise.all([
        db.productExperience.findMany({
          where,
          include: {
            product: {
              select: { id: true, name: true, slug: true },
            },
            customer: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.productExperience.count({ where }),
      ])

      return NextResponse.json({
        experiences,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      })
    } catch (error) {
      console.error('Error fetching experiences:', error)
      return NextResponse.json(
        { error: 'Failed to fetch experiences' },
        { status: 500 }
      )
    }
  })
}
