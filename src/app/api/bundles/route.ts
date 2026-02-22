import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const active = searchParams.get('active')

    const where: Record<string, unknown> = {}
    if (active === 'true') {
      where.isActive = true
    }

    const bundles = await db.productBundle.findMany({ /* take: handled */
      where,
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { take: 1 },
                variants: true,
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ bundles })
  } catch (error) {
    console.error('Bundles fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bundles' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require admin for creation
    const { requireAdmin } = await import('@/lib/admin/middleware')
    const auth = await requireAdmin()
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      slug,
      name,
      description,
      imageUrl,
      priceCents,
      items,
    } = body

    // Calculate original price and savings
    let originalPriceCents = 0
    for (const item of items) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
        include: { variants: { take: 1 } },
      })
      if (product && product.variants[0]) {
        originalPriceCents += product.variants[0].price * (item.quantity || 1)
      }
    }

    const savingsPercent = Math.round(((originalPriceCents - priceCents) / originalPriceCents) * 100)

    const bundle = await db.productBundle.create({
      data: {
        slug,
        name,
        description,
        imageUrl,
        priceCents,
        originalPriceCents,
        savingsPercent,
        items: {
          create: items.map((item: { productId: string; quantity: number }, index: number) => ({
            productId: item.productId,
            quantity: item.quantity || 1,
            sortOrder: index,
          })),
        },
      },
      include: {
        items: {
          include: { product: true },
        },
      },
    })

    return NextResponse.json({ bundle })
  } catch (error) {
    console.error('Bundle creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create bundle' },
      { status: 500 }
    )
  }
}
