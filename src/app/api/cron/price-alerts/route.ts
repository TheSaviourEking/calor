import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendPriceDropAlert } from '@/lib/email'

// This endpoint should be called by a cron job to check for price drops
// Can be secured with a cron secret in production

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret (optional but recommended for production)
    const cronSecret = request.headers.get('x-cron-secret')
    if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all active price drop alerts with product and customer info
    const alerts = await db.priceDropAlert.findMany({ /* take: handled */
      where: {
        isActive: true,
        isNotified: false,
      },
      include: {
        product: {
          include: {
            variants: { take: 1 },
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
        // Get current price from the first variant
        const currentPrice = alert.product.variants[0]?.price || 0

        // Check if price has dropped to or below target price
        if (currentPrice <= alert.targetPrice) {
          // Send price drop alert email
          await sendPriceDropAlert({
            email: alert.customer.email,
            customerName: alert.customer.firstName,
            productName: alert.product.name,
            originalPrice: alert.currentPrice,
            newPrice: currentPrice,
            productSlug: alert.product.slug,
          })

          // Mark as notified
          await db.priceDropAlert.update({
            where: { id: alert.id },
            data: { 
              isNotified: true,
              isActive: false,
            },
          })

          results.triggered++
        } else if (currentPrice < alert.currentPrice) {
          // Update current price if it dropped but not to target
          await db.priceDropAlert.update({
            where: { id: alert.id },
            data: { currentPrice },
          })
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
    console.error('Price alert check error:', error)
    return NextResponse.json(
      { error: 'Failed to check price alerts' },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Get stats about price alerts
  const stats = await db.priceDropAlert.groupBy({
    by: ['isActive', 'isNotified'],
    _count: true,
  })

  return NextResponse.json({ stats })
}
