import { db } from '@/lib/db'
import { sendBackInStockAlert, sendPriceDropAlert } from '@/lib/email'

/**
 * Check and send back-in-stock alerts for a specific product
 * Should be called when product inventory is updated
 */
export async function checkAndSendStockAlerts(productId: string) {
  try {
    // Get product with variants
    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        variants: true,
      },
    })

    if (!product) return { sent: 0 }

    // Check if product is now in stock
    const isInStock = product.inventoryCount > 0 || 
      product.variants.some(v => v.stock > 0)

    if (!isInStock) return { sent: 0 }

    // Get all active stock alerts for this product
    const alerts = await db.stockAlert.findMany({ take: 50,
      where: {
        productId,
        isActive: true,
        isNotified: false,
      },
      include: {
        customer: true,
      },
    })

    let sent = 0

    for (const alert of alerts) {
      // If alert is for a specific variant, check that variant
      if (alert.variantId) {
        const variant = product.variants.find(v => v.id === alert.variantId)
        if (!variant || variant.stock <= 0) continue
      }

      try {
        // Send back in stock alert
        await sendBackInStockAlert({
          email: alert.customer.email,
          customerName: alert.customer.firstName,
          productName: product.name,
          productSlug: product.slug,
        })

        // Mark as notified
        await db.stockAlert.update({
          where: { id: alert.id },
          data: {
            isNotified: true,
            isActive: false,
          },
        })

        sent++
      } catch (error) {
        console.error(`Failed to send stock alert to ${alert.customer.email}:`, error)
      }
    }

    return { sent }
  } catch (error) {
    console.error('Error checking stock alerts:', error)
    return { sent: 0, error: true }
  }
}

/**
 * Check and send price drop alerts for a specific product
 * Should be called when product price is updated
 */
export async function checkAndSendPriceDropAlerts(productId: string, newPrice: number) {
  try {
    // Get all active price drop alerts for this product where target price is met
    const alerts = await db.priceDropAlert.findMany({ /* take: handled */
      where: {
        productId,
        isActive: true,
        isNotified: false,
        targetPrice: { gte: newPrice },
      },
      include: {
        product: {
          include: { variants: { take: 1 } },
        },
        customer: true,
      },
    })

    let sent = 0

    for (const alert of alerts) {
      try {
        // Send price drop alert
        await sendPriceDropAlert({
          email: alert.customer.email,
          customerName: alert.customer.firstName,
          productName: alert.product.name,
          originalPrice: alert.currentPrice,
          newPrice: newPrice,
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

        sent++
      } catch (error) {
        console.error(`Failed to send price alert to ${alert.customer.email}:`, error)
      }
    }

    // Update current price for all remaining alerts
    if (newPrice > 0) {
      await db.priceDropAlert.updateMany({
        where: {
          productId,
          isActive: true,
          isNotified: false,
        },
        data: { currentPrice: newPrice },
      })
    }

    return { sent }
  } catch (error) {
    console.error('Error checking price alerts:', error)
    return { sent: 0, error: true }
  }
}
