import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { db } from '@/lib/db'
import { config } from '@/lib/config'
import { rateLimitByIp } from '@/lib/rate-limit'

const resend = new Resend(config.resend.apiKey)

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// POST - Send anonymous gift notification
export async function POST(request: NextRequest) {
  try {
    const rl = await rateLimitByIp(request, 'anonymous-gift', { windowMs: 60_000, maxRequests: 5 })
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }

    const body = await request.json()
    const recipientEmail = typeof body.recipientEmail === 'string' ? body.recipientEmail.trim() : ''
    const orderReference = typeof body.orderReference === 'string' ? body.orderReference.trim() : ''
    const senderName = typeof body.senderName === 'string' ? escapeHtml(body.senderName.slice(0, 100)) : ''

    if (!recipientEmail || !orderReference) {
      return NextResponse.json({ error: 'Recipient email and order reference are required' }, { status: 400 })
    }

    // The notification is only sent for an order that really is an anonymous
    // gift to this recipient, and the message comes from the order, not the caller
    const order = await db.order.findUnique({
      where: { reference: orderReference },
      select: { isAnonymousGift: true, recipientEmail: true, giftMessage: true },
    })
    if (
      !order ||
      !order.isAnonymousGift ||
      order.recipientEmail?.toLowerCase() !== recipientEmail.toLowerCase()
    ) {
      return NextResponse.json({ error: 'Gift order not found' }, { status: 404 })
    }

    const giftMessage = order.giftMessage ? escapeHtml(order.giftMessage) : ''

    // Send anonymous gift notification email
    await resend.emails.send({
      from: 'CALO CO. <gifts@calo.one>',
      to: recipientEmail,
      subject: 'You have received a gift',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'DM Sans', sans-serif; background: #FAF8F5; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; }
            h1 { font-family: 'Cormorant Garamond', serif; font-weight: 300; color: #2C2420; font-size: 32px; }
            .order-ref { color: #C4785A; font-size: 14px; letter-spacing: 0.1em; }
            .gift-box { background: #F7F2EC; padding: 30px; margin: 20px 0; text-align: center; }
            .message { font-style: italic; color: #6B5D56; margin: 20px 0; padding: 20px; border-left: 3px solid #C4785A; }
            .discreet { background: #FEF3F0; padding: 20px; margin-top: 30px; font-size: 14px; color: #6B5D56; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E8DDD0; font-size: 12px; color: #8B7D74; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>You have received a gift</h1>
            
            <div class="gift-box">
              <p style="font-size: 48px; margin: 0;">A special delivery awaits you</p>
              <p style="font-size: 18px; margin-top: 10px;">Someone special has sent you a gift from CALO CO.</p>
            </div>
            
            ${giftMessage ? `<div class="message">"${giftMessage}"</div>` : ''}
            
            ${senderName ? `<p>A message from: ${senderName}</p>` : ''}
            
            <p class="order-ref">Order #${escapeHtml(orderReference)}</p>
            
            <p>Your gift is on its way! You'll receive tracking information once it ships.</p>
            
            <div class="discreet">
              <strong>About Your Delivery</strong><br>
              Your gift will arrive in plain, unmarked packaging. No product names or brand visible on the outside. Your privacy matters to us.
            </div>
            
            <div class="footer">
              <p>If you have any questions, contact gifts@calo.one</p>
              <p>The calo. team</p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending gift notification:', error)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}
