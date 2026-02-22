import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendAbandonedCartEmail } from '@/lib/email'

// This endpoint should be called by a cron service (e.g., Vercel Cron, GitHub Actions, etc.)
// It sends recovery emails for abandoned carts older than 1 hour and less than 72 hours old

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional but recommended for production)
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const threeDaysAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Find abandoned carts that:
    // - Are older than 1 hour but less than 72 hours
    // - Have an email (customer or guest)
    // - Haven't been recovered
    // - Haven't received more than 3 emails
    // - For first email: cart is 1-2 hours old
    // - For second email: cart is 24+ hours old and last email was 24+ hours ago
    const abandonedCarts = await db.abandonedCart.findMany({ take: 50,
      where: {
        recovered: false,
        createdAt: {
          gte: threeDaysAgo,
          lte: oneHourAgo,
        },
        recoveryEmailsSent: { lt: 3 },
        OR: [
          // First email: 1-2 hours old, no emails sent yet
          {
            recoveryEmailsSent: 0,
            createdAt: { lte: oneHourAgo },
          },
          // Second email: 24+ hours old, last email was 24+ hours ago
          {
            recoveryEmailsSent: 1,
            lastEmailSentAt: { lte: oneDayAgo },
          },
          // Third email: 48+ hours old, last email was 24+ hours ago
          {
            recoveryEmailsSent: 2,
            lastEmailSentAt: { lte: oneDayAgo },
            createdAt: { lte: new Date(now.getTime() - 48 * 60 * 60 * 1000) },
          },
        ],
      },
      include: {
        customer: true,
      },
    })

    const results = {
      processed: 0,
      emailsSent: 0,
      errors: [] as string[],
    }

    for (const cart of abandonedCarts) {
      results.processed++

      const email = cart.email || cart.customer?.email
      const name = cart.customer?.firstName || 'there'

      if (!email) {
        results.errors.push(`Cart ${cart.id}: No email address`)
        continue
      }

      try {
        const cartData = JSON.parse(cart.cartData)

        // Calculate discount based on email number
        const discountPercent = cart.recoveryEmailsSent === 0 ? 10 :
          cart.recoveryEmailsSent === 1 ? 15 : 20

        // Generate recovery discount code
        const discountCode = `BACK${Math.random().toString(36).substring(2, 8).toUpperCase()}`

        // Create promotion for recovery
        await db.promotion.create({
          data: {
            code: discountCode,
            name: `Abandoned Cart Recovery ${discountCode}`,
            description: `${discountPercent}% discount for abandoned cart recovery`,
            type: 'percentage',
            value: discountPercent,
            minOrderCents: 0,
            startsAt: new Date(),
            endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            isActive: true,
            usageLimit: 1,
          },
        })

        // Send recovery email
        await sendAbandonedCartEmail({
          email,
          name,
          cartData,
          discountCode,
          discountPercent,
        })

        // Update abandoned cart
        await db.abandonedCart.update({
          where: { id: cart.id },
          data: {
            recoveryEmailsSent: { increment: 1 },
            lastEmailSentAt: new Date(),
          },
        })

        results.emailsSent++
      } catch (error) {
        console.error(`Failed to process cart ${cart.id}:`, error)
        results.errors.push(`Cart ${cart.id}: Failed to send email`)
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      ...results,
    })
  } catch (error) {
    console.error('Abandoned cart cron error:', error)
    return NextResponse.json(
      { error: 'Failed to process abandoned carts' },
      { status: 500 }
    )
  }
}
