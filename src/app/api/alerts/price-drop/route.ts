import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

// GET - Get all price drop alerts for logged-in customer
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const alerts = await db.priceDropAlert.findMany({ /* take: handled */
      where: { customerId: session.customerId, isActive: true },
      include: {
        product: {
          include: {
            images: { orderBy: { sortOrder: 'asc' }, take: 1 },
            variants: { take: 1 },
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
      imageUrl: alert.product.images[0]?.url || null,
      targetPrice: alert.targetPrice,
      currentPrice: alert.currentPrice,
      latestPrice: alert.product.variants[0]?.price || 0,
      isNotified: alert.isNotified,
      createdAt: alert.createdAt,
    }))

    return NextResponse.json({ alerts: formattedAlerts })
  } catch (error) {
    console.error('Error fetching price drop alerts:', error)
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
  }
}

// POST - Create a new price drop alert
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId, targetPrice } = await request.json()

    if (!productId || !targetPrice) {
      return NextResponse.json({ error: 'Product ID and target price are required' }, { status: 400 })
    }

    // Get current price
    const product = await db.product.findUnique({
      where: { id: productId },
      include: { variants: { take: 1 } },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const currentPrice = product.variants[0]?.price || 0

    // Check if alert already exists
    const existing = await db.priceDropAlert.findUnique({
      where: {
        customerId_productId: {
          customerId: session.customerId,
          productId,
        },
      },
    })

    if (existing) {
      // Update existing alert
      const updated = await db.priceDropAlert.update({
        where: { id: existing.id },
        data: {
          targetPrice,
          currentPrice,
          isActive: true,
          isNotified: false,
        },
      })
      return NextResponse.json({ alert: updated })
    }

    // Create new alert
    const alert = await db.priceDropAlert.create({
      data: {
        customerId: session.customerId,
        productId,
        targetPrice,
        currentPrice,
      },
    })

    return NextResponse.json({ alert })
  } catch (error) {
    console.error('Error creating price drop alert:', error)
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 })
  }
}

// DELETE - Remove a price drop alert
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
    const alert = await db.priceDropAlert.findUnique({
      where: { id: alertId },
    })

    if (!alert || alert.customerId !== session.customerId) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    await db.priceDropAlert.update({
      where: { id: alertId },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting price drop alert:', error)
    return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 })
  }
}
