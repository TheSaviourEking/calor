import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendGiftCardEmail } from '@/lib/email'

// POST /api/cron/gift-cards - Send scheduled gift cards
// This should be called by a cron job (e.g., every hour)
// Authorization: X-Cron-Key header
export async function POST(request: NextRequest) {
  try {
    // Verify cron authorization
    const cronKey = request.headers.get('x-cron-key')
    // Simple authentication
    const expectedKey = process.env.CRON_SECRET
    if (!expectedKey || cronKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const now = new Date()

    // Find gift cards scheduled for delivery now or in the past that haven't been delivered
    const scheduledGiftCards = await db.giftCard.findMany({
      take: 50,
      where: {
        scheduledDelivery: {
          lte: now,
        },
        isDelivered: false,
        isExpired: false,
      },
      include: {
        purchaser: true,
      },
    })

    console.log(`[CRON] Found ${scheduledGiftCards.length} gift cards to deliver`)

    const results: any[] = []

    for (const giftCard of scheduledGiftCards) {
      try {
        // Send the gift card email
        const result = await sendGiftCardEmail({
          recipientEmail: giftCard.recipientEmail,
          recipientName: giftCard.recipientName || 'Valued Customer',
          senderName: giftCard.senderName || giftCard.purchaser
            ? `${giftCard.purchaser.firstName} ${giftCard.purchaser.lastName}`
            : 'A Friend',
          code: giftCard.code,
          value: giftCard.initialValueCents,
          message: giftCard.message || undefined,
        })

        if (result.success) {
          // Mark as delivered
          await db.giftCard.update({
            where: { id: giftCard.id },
            data: { isDelivered: true },
          })

          results.push({
            id: giftCard.id,
            code: giftCard.code,
            recipient: giftCard.recipientEmail,
            status: 'delivered',
          })
        } else {
          results.push({
            id: giftCard.id,
            code: giftCard.code,
            recipient: giftCard.recipientEmail,
            status: 'failed',
            error: result.error,
          })
        }
      } catch (err) {
        console.error(`[CRON] Failed to deliver gift card ${giftCard.id}:`, err)
        results.push({
          id: giftCard.id,
          code: giftCard.code,
          recipient: giftCard.recipientEmail,
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed: scheduledGiftCards.length,
      results,
      timestamp: now.toISOString(),
    })

  } catch (error) {
    console.error('[CRON] Gift card delivery error:', error)
    return NextResponse.json(
      { error: 'Failed to process gift cards', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
