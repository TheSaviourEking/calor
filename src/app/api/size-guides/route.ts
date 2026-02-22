import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const productId = searchParams.get('productId')

    const where: Record<string, unknown> = { isActive: true }
    
    if (categoryId) {
      where.OR = [
        { categoryId },
        { categoryId: null }, // Also include general guides
      ]
    }

    const sizeGuides = await db.sizeGuide.findMany({ take: 50,
      where,
      include: {
        category: true,
        charts: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    })

    // If productId provided, get size recommendation
    let sizeRecommendation = null
    if (productId) {
      sizeRecommendation = await db.sizeRecommendation.findUnique({
        where: { productId },
      })
    }

    return NextResponse.json({ sizeGuides, sizeRecommendation })
  } catch (error) {
    console.error('Size guides fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch size guides' },
      { status: 500 }
    )
  }
}
