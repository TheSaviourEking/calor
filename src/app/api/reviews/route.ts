import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const customerId = searchParams.get('customerId')
    const approved = searchParams.get('approved')

    const where: Record<string, unknown> = {}
    
    if (productId) {
      where.productId = productId
    }
    
    if (customerId) {
      where.customerId = customerId
    }
    
    // Only show approved reviews for public API
    if (approved === 'true' || !approved) {
      where.isApproved = true
    }

    const reviews = await db.review.findMany({ /* take: handled */
      where,
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // Calculate summary statistics if productId is provided
    let summary = null
    if (productId) {
      const stats = await db.review.aggregate({
        where: { productId, isApproved: true },
        _avg: { rating: true },
        _count: { id: true },
      })

      const ratingDistribution = await db.review.groupBy({
        by: ['rating'],
        where: { productId, isApproved: true },
        _count: { rating: true },
      })

      summary = {
        averageRating: stats._avg.rating || 0,
        totalReviews: stats._count.id,
        distribution: {
          5: ratingDistribution.find(r => r.rating === 5)?._count.rating || 0,
          4: ratingDistribution.find(r => r.rating === 4)?._count.rating || 0,
          3: ratingDistribution.find(r => r.rating === 3)?._count.rating || 0,
          2: ratingDistribution.find(r => r.rating === 2)?._count.rating || 0,
          1: ratingDistribution.find(r => r.rating === 1)?._count.rating || 0,
        },
      }
    }

    return NextResponse.json({ reviews, summary })
  } catch (error) {
    console.error('Reviews fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    const body = await request.json()
    
    const { productId, rating, title, content, photos, guestName, guestEmail } = body

    if (!productId || !rating || !title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Check if product exists
    const product = await db.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if customer has purchased this product (for verified purchase badge)
    let isVerifiedPurchase = false
    if (session?.customerId) {
      const orderItem = await db.orderItem.findFirst({
        where: {
          productId,
          order: {
            customerId: session.customerId,
            status: { in: ['PAYMENT_RECEIVED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
          },
        },
      })
      isVerifiedPurchase = !!orderItem
    }

    // Check if customer already reviewed this product
    if (session?.customerId) {
      const existingReview = await db.review.findFirst({
        where: {
          productId,
          customerId: session.customerId,
        },
      })

      if (existingReview) {
        return NextResponse.json(
          { error: 'You have already reviewed this product' },
          { status: 400 }
        )
      }
    }

    const review = await db.review.create({
      data: {
        productId,
        customerId: session?.customerId || null,
        guestName: session ? null : guestName,
        guestEmail: session ? null : guestEmail,
        rating,
        title,
        content,
        photos: photos ? JSON.stringify(photos) : null,
        isVerifiedPurchase,
        isApproved: false, // Reviews need admin approval
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      review,
      message: 'Review submitted successfully. It will be visible after moderation.',
    })
  } catch (error) {
    console.error('Review creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    )
  }
}
