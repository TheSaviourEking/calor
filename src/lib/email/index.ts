import { Resend } from 'resend'
import { db } from '@/lib/db'
import { config } from '@/lib/config'

// Initialize Resend with API key
const resendApiKey = config.resend.apiKey
const resend = new Resend(resendApiKey)

// Email enabled check
const isEmailEnabled = !!resendApiKey && !resendApiKey.includes('placeholder')


// Log email attempts
function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return '[masked]'
  if (local.length <= 2) return `**@${domain}`
  return `${local[0]}***${local[local.length - 1]}@${domain}`
}

async function logEmail(
  type: string,
  to: string | string[],
  subject: string,
  success: boolean,
  error?: string
) {
  const emailList = Array.isArray(to) ? to : [to]
  const maskedTo = emailList.map(maskEmail).join(', ')
  console.log(`[EMAIL] ${success ? '✓' : '✗'} ${type} → ${maskedTo} | ${subject}${error ? ` | Error: ${error}` : ''}`)
}

// Check if email service is configured
export function isEmailConfigured(): boolean {
  return isEmailEnabled
}

// Get email configuration status
export function getEmailStatus(): { configured: boolean; message: string } {
  if (!resendApiKey) {
    return { configured: false, message: 'RESEND_API_KEY is not set in environment variables' }
  }
  if (resendApiKey.includes('placeholder') || resendApiKey.includes('123456789')) {
    return { configured: false, message: 'RESEND_API_KEY is set to a placeholder value' }
  }
  return { configured: true, message: 'Email service is configured and ready' }
}

// Generic send function with error handling
async function sendEmail(
  to: string | string[],
  from: string,
  subject: string,
  html: string,
  type: string
): Promise<{ success: boolean; error?: string }> {
  if (!isEmailEnabled) {
    const msg = 'Email service not configured - skipping email'
    console.warn(`[EMAIL] ⚠ ${type} → ${to} | ${subject} | ${msg}`)
    return { success: false, error: msg }
  }

  try {
    const { data, error } = await resend!.emails.send({
      from,
      to,
      subject,
      html,
    })

    if (error) {
      await logEmail(type, Array.isArray(to) ? to.join(', ') : to, subject, false, error.message)
      return { success: false, error: error.message }
    }

    await logEmail(type, Array.isArray(to) ? to.join(', ') : to, subject, true)
    return { success: true, id: data?.id }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    await logEmail(type, Array.isArray(to) ? to.join(', ') : to, subject, false, errorMsg)
    return { success: false, error: errorMsg }
  }
}

// ============================================
// ORDER CONFIRMATION EMAIL
// ============================================

interface OrderEmailData {
  customerEmail: string
  customerName: string
  orderReference: string
  total: number
  currency: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
}

export async function sendOrderConfirmation(data: OrderEmailData): Promise<{ success: boolean; error?: string }> {
  const { customerEmail, customerName, orderReference, total, currency, items } = data

  const itemsList = items
    .map((item) => `<tr><td style="padding: 8px 0;">${item.name}</td><td style="padding: 8px 0; text-align: center;">${item.quantity}</td><td style="padding: 8px 0; text-align: right;">$${(item.price / 100).toFixed(2)}</td></tr>`)
    .join('')

  return sendEmail(
    customerEmail,
    'CALŌR CO. <orders@calorco.com>',
    'Your CALŌR order is confirmed',
    `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; background: #F8F5F0; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border: 1px solid #E8E2D9; }
          h1 { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 300; color: #2C2C2C; font-size: 32px; margin: 0 0 20px 0; }
          .order-ref { color: #C75B39; font-size: 14px; letter-spacing: 0.1em; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { text-align: left; padding: 12px 0; border-bottom: 1px solid #E8E2D9; color: #6B5D56; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; }
          td { border-bottom: 1px solid #E8E2D9; }
          .total { font-size: 20px; font-weight: 500; margin-top: 20px; color: #2C2C2C; }
          .note { background: #F8F5F0; padding: 20px; margin-top: 30px; font-size: 14px; color: #6B5D56; border: 1px solid #E8E2D9; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E8E2D9; font-size: 12px; color: #8B7D74; }
          .button { display: inline-block; background: #2C2C2C; color: #F8F5F0; padding: 12px 24px; text-decoration: none; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Hi ${customerName},</h1>
          <p>Your order is confirmed and on its way to you.</p>
          
          <p class="order-ref">Order #${orderReference}</p>
          
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
          </table>
          
          <p class="total">Total: $${(total / 100).toFixed(2)} ${currency}</p>
          
          <div class="note">
            <strong>Discreet Delivery</strong><br>
            Your order will arrive in plain, unmarked packaging. No product names visible on the outside.
          </div>
          
          <a href="${config.app.baseUrl}/account/orders" class="button">Track Your Order</a>
          
          <div class="footer">
            <p>If you have any questions, reply to this email.</p>
            <p>The CALŌR team</p>
          </div>
        </div>
      </body>
      </html>
    `,
    'ORDER_CONFIRMATION'
  )
}

// ============================================
// WELCOME EMAIL
// ============================================

export async function sendWelcomeEmail(email: string, firstName: string): Promise<{ success: boolean; error?: string }> {
  return sendEmail(
    email,
    'CALŌR CO. <hello@calorco.com>',
    'Welcome to CALŌR',
    `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; background: #F8F5F0; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border: 1px solid #E8E2D9; }
          h1 { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 300; color: #2C2C2C; font-size: 32px; margin: 0 0 20px 0; }
          .feature { margin: 20px 0; padding: 16px; background: #F8F5F0; border: 1px solid #E8E2D9; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E8E2D9; font-size: 12px; color: #8B7D74; }
          .button { display: inline-block; background: #C75B39; color: #F8F5F0; padding: 12px 24px; text-decoration: none; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Welcome, ${firstName}</h1>
          <p>Thank you for creating a CALŌR account. You now have access to:</p>
          
          <div class="feature">
            <strong>Order History</strong><br>
            <span style="color: #6B5D56; font-size: 14px;">Track all your orders in one place.</span>
          </div>
          
          <div class="feature">
            <strong>Wishlist</strong><br>
            <span style="color: #6B5D56; font-size: 14px;">Save items for later and get notified of price changes.</span>
          </div>
          
          <div class="feature">
            <strong>Express Checkout</strong><br>
            <span style="color: #6B5D56; font-size: 14px;">Faster checkout with saved addresses and payment methods.</span>
          </div>
          
          <p style="margin-top: 30px;">We take your privacy seriously. Your bank statement will always show "CALŌR CO." only.</p>
          
          <a href="${config.app.baseUrl}/account" class="button">Visit Your Account</a>
          
          <div class="footer">
            <p>Warmth lives here.</p>
            <p>The CALŌR team</p>
          </div>
        </div>
      </body>
      </html>
    `,
    'WELCOME'
  )
}

// ============================================
// PASSWORD RESET EMAIL
// ============================================

export async function sendPasswordResetEmail(data: {
  email: string
  customerName: string
  resetToken: string
}): Promise<{ success: boolean; error?: string }> {
  const { email, customerName, resetToken } = data
  const resetUrl = `${config.app.baseUrl}/reset-password?token=${resetToken}`

  return sendEmail(
    email,
    'CALŌR CO. <security@calorco.com>',
    'Reset your password',
    `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; background: #F8F5F0; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border: 1px solid #E8E2D9; }
          h1 { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 300; color: #2C2C2C; font-size: 32px; margin: 0 0 20px 0; }
          .button { display: inline-block; background: #2C2C2C; color: #F8F5F0; padding: 14px 28px; text-decoration: none; margin: 20px 0; }
          .warning { background: #FEF3F0; padding: 20px; margin: 20px 0; font-size: 14px; color: #6B5D56; border: 1px solid #E8E2D9; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E8E2D9; font-size: 12px; color: #8B7D74; }
          .link { font-size: 12px; color: #8B7D74; word-break: break-all; background: #F8F5F0; padding: 10px; border: 1px solid #E8E2D9; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Hi ${customerName},</h1>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          
          <a href="${resetUrl}" class="button">Reset Password</a>
          
          <p style="font-size: 14px; color: #6B5D56;">Or copy this link into your browser:</p>
          <p class="link">${resetUrl}</p>
          
          <div class="warning">
            <strong>This link will expire in 1 hour.</strong><br>
            If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
          </div>
          
          <div class="footer">
            <p>For your security, we'll never ask for your password via email.</p>
            <p>The CALŌR team</p>
          </div>
        </div>
      </body>
      </html>
    `,
    'PASSWORD_RESET'
  )
}

// ============================================
// EMAIL VERIFICATION
// ============================================

export async function sendVerificationEmail(data: {
  email: string
  customerName: string
  verifyToken: string
}): Promise<{ success: boolean; error?: string }> {
  const { email, customerName, verifyToken } = data
  const verifyUrl = `${config.app.baseUrl}/api/auth/verify-email?token=${verifyToken}`

  return sendEmail(
    email,
    'CALŌR CO. <hello@calorco.com>',
    'Verify your email address',
    `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; background: #F8F5F0; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border: 1px solid #E8E2D9; }
          h1 { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 300; color: #2C2C2C; font-size: 32px; margin: 0 0 20px 0; }
          .button { display: inline-block; background: #C75B39; color: #F8F5F0; padding: 14px 28px; text-decoration: none; margin: 20px 0; }
          .feature { margin: 20px 0; padding: 16px; background: #F8F5F0; border: 1px solid #E8E2D9; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E8E2D9; font-size: 12px; color: #8B7D74; }
          .link { font-size: 12px; color: #8B7D74; word-break: break-all; background: #F8F5F0; padding: 10px; border: 1px solid #E8E2D9; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Hi ${customerName},</h1>
          <p>Thanks for creating a CALŌR account. Please verify your email address to get started:</p>
          
          <a href="${verifyUrl}" class="button">Verify Email</a>
          
          <p style="font-size: 14px; color: #6B5D56;">Or copy this link into your browser:</p>
          <p class="link">${verifyUrl}</p>
          
          <p style="margin-top: 30px; font-size: 14px; color: #2C2C2C;">Once verified, you'll have access to:</p>
          
          <div class="feature">
            <strong>Order Tracking</strong><br>
            <span style="color: #6B5D56; font-size: 14px;">Track all your orders in one place.</span>
          </div>
          
          <div class="feature">
            <strong>Wishlist</strong><br>
            <span style="color: #6B5D56; font-size: 14px;">Save favorites and get notified of price changes.</span>
          </div>
          
          <div class="feature">
            <strong>Exclusive Offers</strong><br>
            <span style="color: #6B5D56; font-size: 14px;">Get early access to sales and new products.</span>
          </div>
          
          <div class="footer">
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
            <p>Warmth lives here.<br>The CALŌR team</p>
          </div>
        </div>
      </body>
      </html>
    `,
    'EMAIL_VERIFICATION'
  )
}

// ============================================
// SHIPPING NOTIFICATION
// ============================================

export async function sendShippingNotification(data: {
  customerEmail: string
  customerName: string
  orderReference: string
  trackingNumber: string
  estimatedDelivery: string
}): Promise<{ success: boolean; error?: string }> {
  const { customerEmail, customerName, orderReference, trackingNumber, estimatedDelivery } = data

  return sendEmail(
    customerEmail,
    'CALŌR CO. <orders@calorco.com>',
    'Your order is on its way',
    `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; background: #F8F5F0; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border: 1px solid #E8E2D9; }
          h1 { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 300; color: #2C2C2C; margin: 0 0 20px 0; }
          .tracking-box { background: #F8F5F0; padding: 20px; margin: 20px 0; text-align: center; border: 1px solid #E8E2D9; }
          .tracking-number { font-size: 24px; font-weight: 500; color: #C75B39; letter-spacing: 0.05em; }
          .note { background: #FEF3F0; padding: 20px; margin-top: 30px; font-size: 14px; color: #6B5D56; border: 1px solid #E8E2D9; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E8E2D9; font-size: 12px; color: #8B7D74; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Hi ${customerName},</h1>
          <p>Great news! Your order has been shipped and is on its way to you.</p>
          
          <p style="color: #C75B39; font-size: 14px; letter-spacing: 0.1em;">Order #${orderReference}</p>
          
          <div class="tracking-box">
            <p style="margin: 0; color: #6B5D56; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Tracking Number</p>
            <p class="tracking-number">${trackingNumber}</p>
          </div>
          
          <p><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>
          
          <div class="note">
            <strong>Discreet Packaging</strong><br>
            Your order is on its way in plain, unmarked packaging. No product names or brand visible on the outside.
          </div>
          
          <div class="footer">
            <p>Track your order at ${config.app.baseUrl}/track-order</p>
            <p>The CALŌR team</p>
          </div>
        </div>
      </body>
      </html>
    `,
    'SHIPPING_NOTIFICATION'
  )
}

// ============================================
// GIFT CARD EMAIL
// ============================================

export async function sendGiftCardEmail(data: {
  recipientEmail: string
  recipientName: string
  senderName: string
  code: string
  value: number
  message?: string
}): Promise<{ success: boolean; error?: string }> {
  const { recipientEmail, recipientName, senderName, code, value, message } = data

  return sendEmail(
    recipientEmail,
    'CALŌR CO. <gifts@calorco.com>',
    `You've received a gift card from ${senderName}`,
    `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; background: #F8F5F0; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border: 1px solid #E8E2D9; }
          h1 { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 300; color: #2C2C2C; font-size: 32px; margin: 0 0 20px 0; }
          .gift-box { background: #F8F5F0; padding: 30px; margin: 20px 0; text-align: center; border: 1px solid #E8E2D9; }
          .code { font-size: 32px; font-weight: 600; color: #C75B39; letter-spacing: 4px; margin: 15px 0; font-family: monospace; }
          .value { font-size: 28px; color: #2C2C2C; }
          .message-box { background: #FEF3F0; padding: 20px; margin: 20px 0; font-style: italic; border: 1px solid #E8E2D9; }
          .button { display: inline-block; background: #C75B39; color: #F8F5F0; padding: 14px 28px; text-decoration: none; margin-top: 20px; }
          .discreet { background: #F8F5F0; padding: 15px; margin-top: 20px; font-size: 13px; color: #6B5D56; border: 1px solid #E8E2D9; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E8E2D9; font-size: 12px; color: #8B7D74; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>You've received a gift</h1>
          <p>Hi ${recipientName},</p>
          <p>${senderName} has sent you a CALŌR gift card.</p>
          
          <div class="gift-box">
            <p class="value">Gift Card Value: $${(value / 100).toFixed(2)}</p>
            <p style="color: #6B5D56; font-size: 13px; margin-bottom: 5px;">Your Gift Card Code:</p>
            <p class="code">${code}</p>
          </div>
          
          ${message ? `
          <div class="message-box">
            <p style="margin: 0;">"${message}"</p>
            <p style="margin-top: 10px; font-style: normal; font-size: 13px;">— ${senderName}</p>
          </div>
          ` : ''}
          
          <p style="font-size: 14px; color: #6B5D56;">
            Use this code at checkout to redeem your gift card. It never expires until used.
          </p>
          
          <a href="${config.app.baseUrl}" class="button">Start Shopping</a>
          
          <div class="discreet">
            <strong>Discreet Shopping</strong><br>
            Your order will arrive in plain, unmarked packaging. Bank statements show only "CALŌR CO."
          </div>
          
          <div class="footer">
            <p>This gift card was purchased on calorco.com</p>
            <p>Questions? Contact us at support@calorco.com</p>
            <p>Warmth lives here.<br>The CALŌR team</p>
          </div>
        </div>
      </body>
      </html>
    `,
    'GIFT_CARD'
  )
}

// ============================================
// ABANDONED CART EMAIL
// ============================================

export async function sendAbandonedCartEmail(data: {
  email: string
  name: string
  cartData: {
    items: Array<{ name: string; quantity: number; price: number }>
    total: number
  }
  discountCode: string
  discountPercent: number
}): Promise<{ success: boolean; error?: string }> {
  const { email, name, cartData, discountCode, discountPercent } = data

  const itemsList = cartData.items
    .map((item) => `<tr><td style="padding: 8px 0;">${item.name} x${item.quantity}</td><td style="padding: 8px 0; text-align: right;">$${(item.price / 100).toFixed(2)}</td></tr>`)
    .join('')

  return sendEmail(
    email,
    'CALŌR CO. <hello@calorco.com>',
    `You left something behind... ${discountPercent}% off inside`,
    `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; background: #F8F5F0; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border: 1px solid #E8E2D9; }
          h1 { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 300; color: #2C2C2C; font-size: 28px; margin: 0 0 20px 0; }
          .discount-box { background: #C75B39; padding: 20px; margin: 20px 0; text-align: center; }
          .discount-code { font-size: 24px; font-weight: 600; color: #F8F5F0; letter-spacing: 4px; font-family: monospace; }
          .cart-summary { background: #F8F5F0; padding: 15px; margin: 20px 0; border: 1px solid #E8E2D9; }
          .button { display: inline-block; background: #2C2C2C; color: #F8F5F0; padding: 14px 28px; text-decoration: none; margin-top: 20px; }
          .discreet { background: #F8F5F0; padding: 15px; margin-top: 20px; font-size: 13px; color: #6B5D56; border: 1px solid #E8E2D9; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E8E2D9; font-size: 12px; color: #8B7D74; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Hi ${name},</h1>
          <p>We noticed you left something in your cart. Come back and complete your purchase with a special ${discountPercent}% discount just for you.</p>
          
          <div class="discount-box">
            <p style="margin: 0; color: #F8F5F0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Your exclusive code</p>
            <p class="discount-code">${discountCode}</p>
            <p style="margin: 5px 0 0 0; color: #F8F5F0; font-size: 12px;">${discountPercent}% off your entire order</p>
          </div>
          
          <div class="cart-summary">
            <p style="margin: 0 0 10px 0; font-weight: 500; color: #2C2C2C;">Your cart (${cartData.items.length} items)</p>
            <table style="width: 100%; font-size: 14px; color: #2C2C2C;">
              ${itemsList}
              <tr style="border-top: 1px solid #E8E2D9;">
                <td style="padding: 10px 0; font-weight: 500;">Total</td>
                <td style="padding: 10px 0; text-align: right; font-weight: 500;">$${(cartData.total / 100).toFixed(2)}</td>
              </tr>
            </table>
          </div>
          
          <a href="${config.app.baseUrl}/checkout" class="button">Complete Your Order</a>
          
          <div class="discreet">
            <strong>Discreet Delivery</strong><br>
            All orders ship in plain packaging. Your privacy is our priority.
          </div>
          
          <div class="footer">
            <p>This offer expires in 7 days. Code can only be used once.</p>
            <p>If you didn't add these items to your cart, you can safely ignore this email.</p>
            <p>Warmth lives here.<br>The CALŌR team</p>
          </div>
        </div>
      </body>
      </html>
    `,
    'ABANDONED_CART'
  )
}

// ============================================
// PRICE DROP ALERT
// ============================================

export async function sendPriceDropAlert(data: {
  email: string
  customerName: string
  productName: string
  originalPrice: number
  newPrice: number
  productSlug: string
}): Promise<{ success: boolean; error?: string }> {
  const { email, customerName, productName, originalPrice, newPrice, productSlug } = data

  return sendEmail(
    email,
    'CALŌR CO. <alerts@calorco.com>',
    `Price Drop: ${productName}`,
    `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; background: #F8F5F0; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border: 1px solid #E8E2D9; }
          h1 { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 300; color: #2C2C2C; margin: 0 0 20px 0; }
          .price-box { background: #F8F5F0; padding: 20px; margin: 20px 0; text-align: center; border: 1px solid #E8E2D9; }
          .old-price { font-size: 18px; color: #8B7D74; text-decoration: line-through; }
          .new-price { font-size: 28px; color: #C75B39; font-weight: 500; }
          .button { display: inline-block; background: #C75B39; color: #F8F5F0; padding: 12px 24px; text-decoration: none; margin-top: 20px; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E8E2D9; font-size: 12px; color: #8B7D74; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Hi ${customerName},</h1>
          <p>Good news! An item on your wishlist has dropped in price.</p>
          
          <p style="font-size: 18px; font-weight: 500;">${productName}</p>
          
          <div class="price-box">
            <span class="old-price">$${(originalPrice / 100).toFixed(2)}</span>
            <br>
            <span class="new-price">$${(newPrice / 100).toFixed(2)}</span>
          </div>
          
          <a href="${config.app.baseUrl}/product/${productSlug}" class="button">Shop Now</a>
          
          <div class="footer">
            <p>You received this because you set a price drop alert.</p>
            <p>The CALŌR team</p>
          </div>
        </div>
      </body>
      </html>
    `,
    'PRICE_DROP_ALERT'
  )
}

// ============================================
// BACK IN STOCK ALERT
// ============================================

export async function sendBackInStockAlert(data: {
  email: string
  customerName: string
  productName: string
  productSlug: string
}): Promise<{ success: boolean; error?: string }> {
  const { email, customerName, productName, productSlug } = data

  return sendEmail(
    email,
    'CALŌR CO. <alerts@calorco.com>',
    `Back in Stock: ${productName}`,
    `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; background: #F8F5F0; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border: 1px solid #E8E2D9; }
          h1 { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 300; color: #2C2C2C; margin: 0 0 20px 0; }
          .button { display: inline-block; background: #C75B39; color: #F8F5F0; padding: 12px 24px; text-decoration: none; margin-top: 20px; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E8E2D9; font-size: 12px; color: #8B7D74; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Hi ${customerName},</h1>
          <p>Great news! <strong>${productName}</strong> is back in stock.</p>
          
          <p>Don't wait - popular items sell out quickly.</p>
          
          <a href="${config.app.baseUrl}/product/${productSlug}" class="button">Shop Now</a>
          
          <div class="footer">
            <p>You received this because you requested a back-in-stock alert.</p>
            <p>The CALŌR team</p>
          </div>
        </div>
      </body>
      </html>
    `,
    'BACK_IN_STOCK'
  )
}

// ============================================
// SECURITY ALERT
// ============================================

export async function sendSecurityAlert(data: {
  email: string
  type: 'login' | 'password_change' | 'new_device' | 'account_update'
  ipAddress: string
  location: string
  device: string
  timestamp: Date
}): Promise<{ success: boolean; error?: string }> {
  const { email, type, ipAddress, location, device, timestamp } = data

  const typeMessages: Record<string, { title: string; body: string }> = {
    login: {
      title: 'New sign-in to your CALŌR account',
      body: 'A new sign-in was detected on your account.',
    },
    password_change: {
      title: 'Your password was changed',
      body: 'Your CALŌR account password was recently changed.',
    },
    new_device: {
      title: 'New device signed in to your account',
      body: 'A new device was used to sign in to your CALŌR account.',
    },
    account_update: {
      title: 'Your account was updated',
      body: 'Your CALŌR account details were recently updated.',
    },
  }

  const message = typeMessages[type] || typeMessages.login

  return sendEmail(
    email,
    'CALŌR CO. <security@calorco.com>',
    message.title,
    `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; background: #F8F5F0; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border: 1px solid #E8E2D9; }
          h1 { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 300; color: #2C2C2C; margin: 0 0 20px 0; }
          .alert-box { background: #FEF3F0; border-left: 4px solid #C75B39; padding: 20px; margin: 20px 0; }
          .detail { margin: 8px 0; font-size: 14px; }
          .label { color: #8B7D74; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; }
          .button { display: inline-block; background: #2C2C2C; color: #F8F5F0; padding: 12px 24px; text-decoration: none; margin-top: 20px; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E8E2D9; font-size: 12px; color: #8B7D74; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${message.title}</h1>
          <p>${message.body}</p>
          
          <div class="alert-box">
            <div class="detail"><span class="label">IP Address</span><br>${ipAddress}</div>
            <div class="detail"><span class="label">Location</span><br>${location}</div>
            <div class="detail"><span class="label">Device</span><br>${device}</div>
            <div class="detail"><span class="label">Time</span><br>${timestamp.toLocaleString()}</div>
          </div>
          
          <p>If this wasn't you, please secure your account immediately by changing your password.</p>
          
          <a href="${config.app.baseUrl}/account/security" class="button">Review Account Activity</a>
          
          <div class="footer">
            <p>If you have any questions, contact security@calorco.com</p>
            <p>The CALŌR team</p>
          </div>
        </div>
      </body>
      </html>
    `,
    'SECURITY_ALERT'
  )
}
