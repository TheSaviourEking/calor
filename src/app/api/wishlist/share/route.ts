import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { nanoid } from 'nanoid'

// POST /api/wishlist/share - Create a shared wishlist
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { productIds, title, description } = body

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: 'Product IDs are required' }, { status: 400 })
    }

    // Generate unique share code
    const shareCode = nanoid(10).toUpperCase()

    const sharedWishlist = await db.sharedWishlist.create({
      data: {
        shareCode,
        customerId: session.customerId,
        title: title || 'My Wishlist',
        description,
        productIds: JSON.stringify(productIds),
      },
    })

    return NextResponse.json({
      shareCode: sharedWishlist.shareCode,
      shareUrl: `${process.env.NEXT_PUBLIC_URL || ''}/wishlist/${sharedWishlist.shareCode}`,
      wishlist: sharedWishlist,
    })
  } catch (error) {
    console.error('Error creating shared wishlist:', error)
    return NextResponse.json(
      { error: 'Failed to create shared wishlist' },
      { status: 500 }
    )
  }
}

// GET /api/wishlist/share - Get user's shared wishlists
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const wishlists = await db.sharedWishlist.findMany({ take: 50,
      where: { customerId: session.customerId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      wishlists: wishlists.map(w => ({
        ...w,
        productIds: JSON.parse(w.productIds),
      })),
    })
  } catch (error) {
    console.error('Error fetching shared wishlists:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shared wishlists' },
      { status: 500 }
    )
  }
}

// DELETE /api/wishlist/share - Delete a shared wishlist
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const shareCode = searchParams.get('shareCode')

    if (!shareCode) {
      return NextResponse.json({ error: 'shareCode is required' }, { status: 400 })
    }

    // Verify ownership
    const wishlist = await db.sharedWishlist.findUnique({
      where: { shareCode },
    })

    if (!wishlist || wishlist.customerId !== session.customerId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await db.sharedWishlist.delete({
      where: { shareCode },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting shared wishlist:', error)
    return NextResponse.json(
      { error: 'Failed to delete shared wishlist' },
      { status: 500 }
    )
  }
}
