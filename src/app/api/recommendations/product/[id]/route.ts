import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/recommendations/product/[id] - Get recommendations for a specific product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // similar, frequently_bought_together, also_viewed, complete_the_look
    const limit = parseInt(searchParams.get('limit') || '6')

    // Get pre-computed recommendations
    const whereClause: Record<string, unknown> = {
      productId,
      isActive: true,
    }

    if (type) {
      whereClause.type = type
    }

    const recommendations = await db.productRecommendation.findMany({ /* take: handled */
      where: whereClause,
      orderBy: { score: 'desc' },
      take: limit,
    })

    // If we have pre-computed recommendations, fetch those products
    if (recommendations.length > 0) {
      const productIds = recommendations.map(r => r.recommendedId)
      const products = await db.product.findMany({ /* take: handled */
        where: {
          id: { in: productIds },
          published: true,
        },
        include: {
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          category: true,
          variants: { take: 1 },
        },
      })

      // Create a map for quick lookup
      const productMap = new Map(products.map(p => [p.id, p]))

      // Sort by recommendation score and attach metadata
      const result = recommendations
        .filter(r => productMap.has(r.recommendedId))
        .map(r => {
          const product = productMap.get(r.recommendedId)!
          const sourceData = r.sourceData ? JSON.parse(r.sourceData) : {}
          return {
            ...product,
            recommendationType: r.type,
            recommendationScore: r.score,
            sourceData,
          }
        })

      return NextResponse.json({
        recommendations: result,
        source: 'precomputed',
      })
    }

    // Generate recommendations on-the-fly
    const product = await db.product.findUnique({
      where: { id: productId },
      include: { category: true },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Similar products from same category
    let similarProducts = await db.product.findMany({ /* take: handled */
      where: {
        categoryId: product.categoryId,
        id: { not: productId },
        published: true,
      },
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        category: true,
        variants: { take: 1 },
      },
      take: limit,
    })

    // If type is 'frequently_bought_together', check order items
    if (type === 'frequently_bought_together') {
      // Find products frequently bought together
      const orderItems = await db.orderItem.findMany({ /* take: handled */
        where: {
          productId,
        },
        include: {
          order: {
            include: {
              items: {
                include: {
                  product: {
                    include: {
                      images: { orderBy: { sortOrder: 'asc' }, take: 1 },
                      category: true,
                    },
                  },
                },
              },
            },
          },
        },
        take: 100,
      })

      // Count co-occurrences
      const coOccurrence: Record<string, number> = {}
      orderItems.forEach(item => {
        item.order.items.forEach(otherItem => {
          if (otherItem.productId !== productId) {
            coOccurrence[otherItem.productId] = (coOccurrence[otherItem.productId] || 0) + 1
          }
        })
      })

      // Sort by frequency and get top products
      const sortedProductIds = Object.entries(coOccurrence)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id]) => id)

      if (sortedProductIds.length > 0) {
        const frequentlyBought = await db.product.findMany({ /* take: handled */
          where: {
            id: { in: sortedProductIds },
            published: true,
          },
          include: {
            images: { orderBy: { sortOrder: 'asc' }, take: 1 },
            category: true,
            variants: { take: 1 },
          },
        })

        // Sort by frequency
        const productMap = new Map(frequentlyBought.map(p => [p.id, p]))
        const sorted = sortedProductIds
          .map(id => productMap.get(id))
          .filter(Boolean)
          .map(p => ({
            ...p,
            recommendationType: 'frequently_bought_together',
            recommendationScore: coOccurrence[p!.id] / orderItems.length,
          }))

        return NextResponse.json({
          recommendations: sorted,
          source: 'computed',
        })
      }
    }

    // Return similar products from same category
    return NextResponse.json({
      recommendations: similarProducts.map(p => ({
        ...p,
        recommendationType: 'similar',
        recommendationScore: 0.5,
      })),
      source: 'fallback',
    })
  } catch (error) {
    console.error('Error fetching product recommendations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    )
  }
}
