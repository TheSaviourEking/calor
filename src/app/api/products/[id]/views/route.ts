import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params
    const session = await getSession()

    // Get or create session ID for tracking
    let sessionId = request.headers.get('x-session-id')
    
    // Record the view
    await db.productView.create({
      data: {
        productId,
        customerId: session?.customerId || null,
        sessionId: session ? null : sessionId,
      },
    })

    // Increment the product view count
    await db.product.update({
      where: { id: productId },
      data: { viewCount: { increment: 1 } },
    })

    // Get recent view count for social proof (last 24 hours)
    const yesterday = new Date()
    yesterday.setHours(yesterday.getHours() - 24)

    const recentViews = await db.productView.count({
      where: {
        productId,
        viewedAt: { gte: yesterday },
      },
    })

    return NextResponse.json({
      success: true,
      recentViews,
    })
  } catch (error) {
    console.error('Product view tracking error:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params

    // Get various social proof metrics
    const product = await db.product.findUnique({
      where: { id: productId },
      select: {
        viewCount: true,
        purchaseCount: true,
        wishlistCount: true,
        inventoryCount: true,
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Get recent views (last 24 hours)
    const yesterday = new Date()
    yesterday.setHours(yesterday.getHours() - 24)

    const recentViews = await db.productView.count({
      where: {
        productId,
        viewedAt: { gte: yesterday },
      },
    })

    // Get wishlist count
    const wishlistAdds = await db.stockAlert.count({
      where: { productId },
    })

    return NextResponse.json({
      totalViews: product.viewCount,
      recentViews,
      totalPurchases: product.purchaseCount,
      wishlistCount: product.wishlistCount || wishlistAdds,
      inventoryCount: product.inventoryCount,
      isLowStock: product.inventoryCount > 0 && product.inventoryCount <= 5,
      isOutOfStock: product.inventoryCount <= 0,
    })
  } catch (error) {
    console.error('Social proof fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch social proof' },
      { status: 500 }
    )
  }
}
