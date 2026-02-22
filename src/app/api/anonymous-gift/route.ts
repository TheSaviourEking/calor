import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// POST - Send anonymous gift notification
export async function POST(request: NextRequest) {
  try {
    const { recipientEmail, orderReference, giftMessage, senderName } = await request.json()

    if (!recipientEmail || !orderReference) {
      return NextResponse.json({ error: 'Recipient email and order reference are required' }, { status: 400 })
    }

    // Send anonymous gift notification email
    await resend.emails.send({
      from: 'CALŌR CO. <gifts@calorco.com>',
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
              <p style="font-size: 18px; margin-top: 10px;">Someone special has sent you a gift from CALŌR CO.</p>
            </div>
            
            ${giftMessage ? `<div class="message">"${giftMessage}"</div>` : ''}
            
            ${senderName ? `<p>A message from: ${senderName}</p>` : ''}
            
            <p class="order-ref">Order #${orderReference}</p>
            
            <p>Your gift is on its way! You'll receive tracking information once it ships.</p>
            
            <div class="discreet">
              <strong>About Your Delivery</strong><br>
              Your gift will arrive in plain, unmarked packaging. No product names or brand visible on the outside. Your privacy matters to us.
            </div>
            
            <div class="footer">
              <p>If you have any questions, contact gifts@calorco.com</p>
              <p>The CALŌR team</p>
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
