import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/products/stock - Get real-time stock status for products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productIds = searchParams.get('ids')?.split(',').filter(Boolean) || []
    const slug = searchParams.get('slug')

    // If slug provided, get product by slug
    if (slug && productIds.length === 0) {
      const product = await db.product.findUnique({
        where: { slug },
        select: {
          id: true,
          name: true,
          inventoryCount: true,
          variants: {
            select: {
              id: true,
              name: true,
              stock: true,
            },
          },
        },
      })

      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }

      return NextResponse.json({ products: [product] })
    }

    if (productIds.length === 0) {
      return NextResponse.json({ products: [] })
    }

    const products = await db.product.findMany({
      where: {
        id: { in: productIds },
      },
      select: {
        id: true,
        name: true,
        inventoryCount: true,
        variants: {
          select: {
            id: true,
            name: true,
            stock: true,
          },
        },
      },
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Error fetching stock status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock status' },
      { status: 500 }
    )
  }
}

// POST /api/products/stock - Batch check stock for multiple variant combinations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items } = body as { items: Array<{ productId: string; variantId?: string; quantity: number }> }

    if (!items || items.length === 0) {
      return NextResponse.json({ results: [] })
    }

    const results = []

    for (const item of items) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
        select: {
          id: true,
          name: true,
          inventoryCount: true,
          isDigital: true,
          variants: {
            select: {
              id: true,
              name: true,
              stock: true,
            },
          },
        },
      })

      if (!product) {
        results.push({
          productId: item.productId,
          variantId: item.variantId,
          available: false,
          error: 'Product not found',
        })
        continue
      }

      // Digital products are always available
      if (product.isDigital) {
        results.push({
          productId: item.productId,
          variantId: item.variantId,
          available: true,
          stock: Infinity,
          isDigital: true,
        })
        continue
      }

      if (item.variantId) {
        const variant = product.variants.find(v => v.id === item.variantId)
        if (!variant) {
          results.push({
            productId: item.productId,
            variantId: item.variantId,
            available: false,
            error: 'Variant not found',
          })
          continue
        }

        results.push({
          productId: item.productId,
          variantId: item.variantId,
          available: variant.stock >= item.quantity,
          stock: variant.stock,
          requestedQuantity: item.quantity,
        })
      } else {
        results.push({
          productId: item.productId,
          variantId: null,
          available: product.inventoryCount >= item.quantity,
          stock: product.inventoryCount,
          requestedQuantity: item.quantity,
        })
      }
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Error checking stock:', error)
    return NextResponse.json(
      { error: 'Failed to check stock' },
      { status: 500 }
    )
  }
}
