import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

// GET - Get all stock alerts for logged-in customer
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const alerts = await db.stockAlert.findMany({ /* take: handled */
      where: { customerId: session.customerId, isActive: true },
      include: {
        product: {
          include: {
            images: { orderBy: { sortOrder: 'asc' }, take: 1 },
            variants: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formattedAlerts = alerts.map((alert) => ({
      id: alert.id,
      productId: alert.productId,
      productName: alert.product.name,
      productSlug: alert.product.slug,
      productInventory: alert.product.inventoryCount,
      imageUrl: alert.product.images[0]?.url || null,
      variantId: alert.variantId,
      isNotified: alert.isNotified,
      createdAt: alert.createdAt,
    }))

    return NextResponse.json({ alerts: formattedAlerts })
  } catch (error) {
    console.error('Error fetching stock alerts:', error)
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
  }
}

// POST - Create a new stock alert
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId, variantId } = await request.json()

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Check product exists
    const product = await db.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if alert already exists
    const existing = await db.stockAlert.findFirst({
      where: {
        customerId: session.customerId,
        productId,
        variantId: variantId || null,
        isActive: true,
      },
    })

    if (existing) {
      return NextResponse.json({ alert: existing, message: 'Alert already exists' })
    }

    // Create new alert
    const alert = await db.stockAlert.create({
      data: {
        customerId: session.customerId,
        productId,
        variantId: variantId || null,
      },
    })

    return NextResponse.json({ alert })
  } catch (error) {
    console.error('Error creating stock alert:', error)
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 })
  }
}

// DELETE - Remove a stock alert
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { alertId } = await request.json()

    if (!alertId) {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 })
    }

    // Verify ownership
    const alert = await db.stockAlert.findUnique({
      where: { id: alertId },
    })

    if (!alert || alert.customerId !== session.customerId) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    await db.stockAlert.update({
      where: { id: alertId },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting stock alert:', error)
    return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 })
  }
}
