import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { productIds } = await request.json()

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ products: [] })
    }

    const products = await db.product.findMany({ /* take: handled */
      where: {
        id: { in: productIds },
        published: true,
      },
      include: {
        category: { select: { name: true, slug: true } },
        variants: { take: 1 },
        images: { take: 1 },
      },
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Error fetching wishlist products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}
