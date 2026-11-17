import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { publicDisplayName } from '@/lib/discretion'

// GET /api/wishlist/shared - Get a shared wishlist by share code
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const shareCode = searchParams.get('code')

    if (!shareCode) {
      return NextResponse.json({ error: 'shareCode is required' }, { status: 400 })
    }

    const sharedWishlist = await db.sharedWishlist.findUnique({
      where: { shareCode },
      include: {
        customer: {
          select: {
            nickname: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!sharedWishlist || !sharedWishlist.isActive) {
      return NextResponse.json({ error: 'Wishlist not found' }, { status: 404 })
    }

    // Check expiration
    if (sharedWishlist.expiresAt && new Date() > sharedWishlist.expiresAt) {
      return NextResponse.json({ error: 'Wishlist has expired' }, { status: 410 })
    }

    // Increment view count
    await db.sharedWishlist.update({
      where: { shareCode },
      data: { viewCount: { increment: 1 } },
    })

    // Parse product IDs
    const productIds: string[] = JSON.parse(sharedWishlist.productIds)

    // Fetch product details
    const products = await db.product.findMany({ /* take: handled */
      where: {
        id: { in: productIds },
      },
      include: {
        category: { select: { name: true, slug: true } },
        variants: { select: { id: true, price: true } },
        images: {
          take: 1,
          select: { url: true, altText: true, treatment: true },
        },
      },
    })

    const { customer, customerId: _customerId, ...rest } = sharedWishlist

    return NextResponse.json({
      wishlist: {
        ...rest,
        ownerName: publicDisplayName(customer, 'A calo. member'),
        productIds,
        products,
      },
    })
  } catch (error) {
    console.error('Error fetching shared wishlist:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shared wishlist' },
      { status: 500 }
    )
  }
}
