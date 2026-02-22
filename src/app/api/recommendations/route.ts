import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/recommendations - Get personalized recommendations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const sessionId = searchParams.get('sessionId')
    const productId = searchParams.get('productId') // For product-specific recommendations
    const type = searchParams.get('type') || 'personalized' // personalized, similar, frequently_bought_together
    const limit = parseInt(searchParams.get('limit') || '10')

    // If productId is provided, get product-specific recommendations
    if (productId) {
      const recommendations = await db.productRecommendation.findMany({ /* take: handled */
        where: {
          productId,
          type: type === 'personalized' ? undefined : type,
          isActive: true,
        },
        orderBy: { score: 'desc' },
        take: limit,
      })

      // Fetch the recommended products
      const productIds = recommendations.map(r => r.recommendedId)
      const products = await db.product.findMany({ /* take: handled */
        where: {
          id: { in: productIds },
          published: true,
        },
        include: {
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          category: true,
        },
      })

      // Sort by recommendation score
      const sortedProducts = recommendations
        .map(r => products.find(p => p.id === r.recommendedId))
        .filter(Boolean)
        .slice(0, limit)

      return NextResponse.json({
        recommendations: sortedProducts,
        type,
        source: 'product',
      })
    }

    // User-specific recommendations
    if (customerId || sessionId) {
      // Get user's view history
      const viewHistory = await db.productView.findMany({ /* take: handled */
        where: customerId
          ? { customerId }
          : { sessionId: sessionId! },
        orderBy: { viewedAt: 'desc' },
        take: 50,
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      })

      // Get user's purchase history
      const orders = customerId
        ? await db.order.findMany({ /* take: handled */
            where: { customerId },
            include: {
              items: {
                include: {
                  product: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          })
        : []

      // Extract purchased product IDs
      const purchasedProductIds = new Set(
        orders.flatMap(o => o.items.map(i => i.productId))
      )

      // Extract viewed product IDs
      const viewedProductIds = new Set(viewHistory.map(v => v.productId))

      // Get category affinity from view history
      const categoryAffinity: Record<string, number> = {}
      viewHistory.forEach(v => {
        const catId = v.product.categoryId
        categoryAffinity[catId] = (categoryAffinity[catId] || 0) + 1
      })

      // Get user preferences if available
      let userPreferences = null
      if (customerId) {
        userPreferences = await db.customerPreferences.findUnique({
          where: { customerId },
        })
      }

      // Get stored recommendations
      const storedRecommendations = await db.userRecommendation.findMany({ /* take: handled */
        where: customerId
          ? { customerId }
          : { sessionId: sessionId! },
        orderBy: { score: 'desc' },
        take: limit,
      })

      // If we have stored recommendations, use them
      if (storedRecommendations.length > 0) {
        const productIds = storedRecommendations.map(r => r.productId)
        const products = await db.product.findMany({ /* take: handled */
          where: {
            id: { in: productIds },
            published: true,
            id: { notIn: [...Array.from(purchasedProductIds)] as string[] }, // Exclude purchased
          },
          include: {
            images: { orderBy: { sortOrder: 'asc' }, take: 1 },
            category: true,
          },
        })

        const sortedProducts = storedRecommendations
          .map(r => ({
            recommendation: r,
            product: products.find(p => p.id === r.productId),
          }))
          .filter(item => item.product)
          .slice(0, limit)

        return NextResponse.json({
          recommendations: sortedProducts.map(item => ({
            ...item.product,
            reasons: item.recommendation.reasons ? JSON.parse(item.recommendation.reasons) : [],
            score: item.recommendation.score,
          })),
          type: 'personalized',
          source: 'user',
        })
      }

      // Generate recommendations on-the-fly
      // 1. Products from favorite categories
      const topCategories = Object.entries(categoryAffinity)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([id]) => id)

      let recommendedProducts = await db.product.findMany({ /* take: handled */
        where: {
          categoryId: { in: topCategories },
          published: true,
          id: { notIn: [...Array.from(viewedProductIds), ...Array.from(purchasedProductIds)] as string[] },
        },
        include: {
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          category: true,
        },
        take: limit,
      })

      // 2. If not enough, add trending products
      if (recommendedProducts.length < limit) {
        const trending = await db.product.findMany({ /* take: handled */
          where: {
            published: true,
            id: { notIn: [...Array.from(viewedProductIds), ...Array.from(purchasedProductIds), ...recommendedProducts.map(p => p.id)] as string[] },
          },
          include: {
            images: { orderBy: { sortOrder: 'asc' }, take: 1 },
            category: true,
          },
          orderBy: { purchaseCount: 'desc' },
          take: limit - recommendedProducts.length,
        })
        recommendedProducts = [...recommendedProducts, ...trending]
      }

      return NextResponse.json({
        recommendations: recommendedProducts.map(p => ({
          ...p,
          reasons: topCategories.includes(p.categoryId)
            ? ['Matches your interests']
            : ['Popular choice'],
          score: topCategories.includes(p.categoryId) ? 0.8 : 0.5,
        })),
        type: 'personalized',
        source: 'generated',
      })
    }

    // No user context - return trending products
    const trending = await db.product.findMany({ /* take: handled */
      where: { published: true },
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        category: true,
      },
      orderBy: { purchaseCount: 'desc' },
      take: limit,
    })

    return NextResponse.json({
      recommendations: trending.map(p => ({
        ...p,
        reasons: ['Trending now'],
        score: 0.7,
      })),
      type: 'trending',
      source: 'default',
    })
  } catch (error) {
    console.error('Error fetching recommendations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    )
  }
}

// POST /api/recommendations - Generate/store recommendations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, sessionId, productId, type, score, reasons, sourceData } = body

    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      )
    }

    // Store user recommendation
    if (customerId || sessionId) {
      const existing = await db.userRecommendation.findFirst({
        where: {
          OR: [
            customerId ? { customerId } : {},
            sessionId ? { sessionId } : {},
          ].filter(Boolean).length > 0 ? {
            OR: [
              ...(customerId ? [{ customerId }] : []),
              ...(sessionId ? [{ sessionId }] : []),
            ],
          } as never : {},
          productId,
        },
      })

      if (existing) {
        const recommendation = await db.userRecommendation.update({
          where: { id: existing.id },
          data: {
            score: score ?? existing.score,
            reasons: reasons ? JSON.stringify(reasons) : existing.reasons,
          },
        })
        return NextResponse.json({ recommendation })
      }

      const recommendation = await db.userRecommendation.create({
        data: {
          customerId: customerId || null,
          sessionId: sessionId || null,
          productId,
          type: type || 'personalized',
          score: score || 0.5,
          reasons: reasons ? JSON.stringify(reasons) : null,
          sourceData: sourceData ? JSON.stringify(sourceData) : null,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      })

      return NextResponse.json({ recommendation })
    }

    return NextResponse.json({ message: 'No user context provided' })
  } catch (error) {
    console.error('Error creating recommendation:', error)
    return NextResponse.json(
      { error: 'Failed to create recommendation' },
      { status: 500 }
    )
  }
}
