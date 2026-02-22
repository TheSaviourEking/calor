import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/registry/[id]/items - List registry items
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await getSession()
    
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const registry = await db.giftRegistry.findFirst({
      where: { id, customerId: session.customerId },
    })

    if (!registry) {
      return NextResponse.json({ error: 'Registry not found' }, { status: 404 })
    }

    const items = await db.registryItem.findMany({ /* take: handled */
      where: { registryId: id },
      include: {
        product: {
          include: {
            images: { take: 1 },
            variants: { take: 1 },
            category: { select: { name: true } },
          },
        },
        purchases: true,
        contributions: true,
      },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error fetching registry items:', error)
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
  }
}

// POST /api/registry/[id]/items - Add item to registry
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await getSession()
    
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const registry = await db.giftRegistry.findFirst({
      where: { id, customerId: session.customerId },
    })

    if (!registry) {
      return NextResponse.json({ error: 'Registry not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      productId,
      name,
      description,
      imageUrl,
      price,
      originalPrice,
      quantity,
      priority,
      category,
      notes,
    } = body

    // If product ID provided, get product info
    let itemData: Record<string, unknown> = {
      registryId: id,
      name,
      description,
      imageUrl,
      price,
      originalPrice,
      quantity: quantity || 1,
      priority: priority || 'medium',
      category,
      notes,
    }

    if (productId) {
      const product = await db.product.findUnique({
        where: { id: productId },
        include: {
          images: { take: 1 },
          variants: { take: 1 },
        },
      })

      if (product) {
        itemData = {
          ...itemData,
          productId,
          name: name || product.name,
          description: description || product.shortDescription,
          imageUrl: imageUrl || product.images[0]?.url,
          price: price || product.variants[0]?.price || 0,
        }
      }
    }

    // Get max sort order
    const maxSort = await db.registryItem.aggregate({
      where: { registryId: id },
      _max: { sortOrder: true },
    })

    const item = await db.registryItem.create({
      data: {
        ...itemData,
        sortOrder: (maxSort._max.sortOrder || 0) + 1,
      },
      include: {
        product: {
          include: {
            images: { take: 1 },
          },
        },
      },
    })

    return NextResponse.json({ item })
  } catch (error) {
    console.error('Error adding registry item:', error)
    return NextResponse.json({ error: 'Failed to add item' }, { status: 500 })
  }
}

// PUT /api/registry/[id]/items - Update item
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await getSession()
    
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const registry = await db.giftRegistry.findFirst({
      where: { id, customerId: session.customerId },
    })

    if (!registry) {
      return NextResponse.json({ error: 'Registry not found' }, { status: 404 })
    }

    const body = await request.json()
    const { itemId, ...updates } = body

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 })
    }

    const item = await db.registryItem.update({
      where: { id: itemId, registryId: id },
      data: updates,
    })

    return NextResponse.json({ item })
  } catch (error) {
    console.error('Error updating registry item:', error)
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
  }
}

// DELETE /api/registry/[id]/items - Remove item
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await getSession()
    
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const registry = await db.giftRegistry.findFirst({
      where: { id, customerId: session.customerId },
    })

    if (!registry) {
      return NextResponse.json({ error: 'Registry not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 })
    }

    await db.registryItem.delete({
      where: { id: itemId, registryId: id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting registry item:', error)
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
  }
}
