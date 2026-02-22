import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/streams/[id]/products - Get products for a stream
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const products = await db.streamProduct.findMany({ take: 50,
      where: { streamId: id },
      orderBy: [{ isPinned: 'desc' }, { sortOrder: 'asc' }],
      include: {
        product: {
          include: {
            images: { orderBy: { sortOrder: 'asc' } },
            variants: true,
            category: { select: { name: true, slug: true } },
          },
        },
      },
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Error fetching stream products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stream products' },
      { status: 500 }
    )
  }
}

// POST /api/streams/[id]/products - Add product to stream
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { productId, hostNotes, recommendationReason } = body

    // Check if product already added
    const existing = await db.streamProduct.findUnique({
      where: {
        streamId_productId: { streamId: id, productId },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Product already added to stream' },
        { status: 400 }
      )
    }

    // Get current max sort order
    const maxSort = await db.streamProduct.aggregate({
      where: { streamId: id },
      _max: { sortOrder: true },
    })

    const streamProduct = await db.streamProduct.create({
      data: {
        streamId: id,
        productId,
        hostNotes,
        recommendationReason,
        sortOrder: (maxSort._max.sortOrder || 0) + 1,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: { take: 1 },
            variants: { take: 1 },
          },
        },
      },
    })

    return NextResponse.json({ streamProduct }, { status: 201 })
  } catch (error) {
    console.error('Error adding product to stream:', error)
    return NextResponse.json(
      { error: 'Failed to add product' },
      { status: 500 }
    )
  }
}
