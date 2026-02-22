import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendBackInStockAlert } from '@/lib/email'

// This endpoint should be called by a cron job to check for back in stock
// Can be secured with a cron secret in production

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret (optional but recommended for production)
    const cronSecret = request.headers.get('x-cron-secret')
    if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all active stock alerts that haven't been notified
    const alerts = await db.stockAlert.findMany({ take: 50,
      where: {
        isActive: true,
        isNotified: false,
      },
      include: {
        product: {
          include: {
            variants: true,
          },
        },
        customer: true,
      },
    })

    const results = {
      checked: alerts.length,
      triggered: 0,
      errors: 0,
    }

    for (const alert of alerts) {
      try {
        let isInStock = false

        if (alert.variantId) {
          // Check specific variant
          const variant = alert.product.variants.find(v => v.id === alert.variantId)
          isInStock = variant ? variant.stock > 0 : false
        } else {
          // Check if any variant is in stock
          isInStock = alert.product.variants.some(v => v.stock > 0)
        }

        // Also check product inventory count
        if (alert.product.inventoryCount > 0) {
          isInStock = true
        }

        if (isInStock) {
          // Send back in stock alert email
          await sendBackInStockAlert({
            email: alert.customer.email,
            customerName: alert.customer.firstName,
            productName: alert.product.name,
            productSlug: alert.product.slug,
          })

          // Mark as notified
          await db.stockAlert.update({
            where: { id: alert.id },
            data: { 
              isNotified: true,
              isActive: false,
            },
          })

          results.triggered++
        }
      } catch {
        results.errors++
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Stock alert check error:', error)
    return NextResponse.json(
      { error: 'Failed to check stock alerts' },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Get stats about stock alerts
  const stats = await db.stockAlert.groupBy({
    by: ['isActive', 'isNotified'],
    _count: true,
  })

  // Get products with low stock that have alerts
  const lowStockWithAlerts = await db.product.findMany({ take: 50,
    where: {
      OR: [
        { inventoryCount: { lte: 0 } },
        { variants: { some: { stock: { lte: 0 } } } },
      ],
      stockAlerts: { some: { isActive: true, isNotified: false } },
    },
    include: {
      _count: {
        select: { stockAlerts: { where: { isActive: true } } },
      },
    },
  })

  return NextResponse.json({ 
    stats,
    productsAwaitingStock: lowStockWithAlerts.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      alertCount: p._count.stockAlerts,
    })),
  })
}
