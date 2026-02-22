import crypto from 'crypto'
import { db } from '@/lib/db'
import { sendOrderConfirmation } from '@/lib/email/index'
import { config } from '@/lib/config'

interface CoinbaseChargeResponse {
  data: {
    id: string
    hosted_url: string
    addresses: {
      bitcoin?: string
      ethereum?: string
      usdc?: string
      litecoin?: string
    }
  }
}

export async function createCryptoCharge(orderId: string): Promise<{ chargeId: string; hostedUrl: string }> {
  const order = await db.order.findUnique({
    where: { id: orderId },
  })

  if (!order) throw new Error('Order not found')

  const response = await fetch('https://api.commerce.coinbase.com/charges', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CC-Api-Key': process.env.COINBASE_COMMERCE_API_KEY || '',
      'X-CC-Version': '2018-03-22',
    },
    body: JSON.stringify({
      name: 'CALŌR Order',
      description: `Order ${order.reference}`,
      pricing_type: 'fixed_price',
      local_price: {
        amount: (order.totalCents / 100).toFixed(2),
        currency: order.currency,
      },
      metadata: {
        orderId: order.id,
        reference: order.reference,
      },
      redirect_url: `${config.app.baseUrl}/checkout/confirmation?ref=${order.reference}`,
      cancel_url: `${config.app.baseUrl}/checkout/payment`,
    }),
  })

  const charge: CoinbaseChargeResponse = await response.json()

  await db.order.update({
    where: { id: orderId },
    data: {
      paymentMethod: 'crypto',
      paymentProvider: 'coinbase',
      paymentRef: charge.data.id,
    },
  })

  return {
    chargeId: charge.data.id,
    hostedUrl: charge.data.hosted_url,
  }
}

export function verifyCoinbaseWebhook(signature: string, body: string): boolean {
  if (!signature) return false

  const expected = crypto
    .createHmac('sha256', config.coinbase.webhookSecret)
    .update(body)
    .digest('hex')

  const sigBuffer = Buffer.from(signature, 'hex')
  const expBuffer = Buffer.from(expected, 'hex')

  if (sigBuffer.length !== expBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(sigBuffer, expBuffer)
}

export async function handleCryptoWebhook(event: { type: string; data: { metadata: { orderId: string } } }) {
  if (event.type === 'charge:confirmed') {
    const { orderId } = event.data.metadata

    const order = await db.order.update({
      where: { id: orderId },
      data: { status: 'PAYMENT_RECEIVED' },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    })

    if (order.customer) {
      await sendOrderConfirmation({
        customerEmail: order.customer.email,
        customerName: order.customer.firstName,
        orderReference: order.reference,
        total: order.totalCents,
        currency: order.currency,
        items: order.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.priceCents,
        })),
      })
    }
  }
}
