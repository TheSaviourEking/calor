import crypto from 'crypto'
import { db } from '@/lib/db'
import { markOrderPaid, cancelOrderAndRelease } from '@/lib/orders/lifecycle'
import { config } from '@/lib/config'
import { PaymentMethodLockedError } from '@/lib/payments/locked'

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
  if (order.status !== 'PENDING') throw new Error('Order is not awaiting payment')

  // Bank details were already issued: money may be on its way
  if (order.paymentProvider === 'bank_transfer') throw new PaymentMethodLockedError('bank_transfer')

  const response = await fetch('https://api.commerce.coinbase.com/charges', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CC-Api-Key': process.env.COINBASE_COMMERCE_API_KEY || '',
      'X-CC-Version': '2018-03-22',
    },
    body: JSON.stringify({
      name: 'calo. Order',
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
  // Coinbase is optional — if not configured, reject all webhook calls
  if (!config.coinbase.webhookSecret) return false

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

export async function handleCryptoWebhook(event: { type: string; data: { id?: string; metadata?: { orderId?: string } } }) {
  const orderId = event.data?.metadata?.orderId

  switch (event.type) {
    // Resolved: the owner accepted an under/over/late payment in the dashboard
    case 'charge:confirmed':
    case 'charge:resolved': {
      if (orderId) await markOrderPaid(orderId)
      break
    }

    // The order was already cancelled and released when the charge expired,
    // so this needs a human rather than a state change
    case 'charge:delayed': {
      console.error('[Coinbase] Payment arrived after the charge expired — resolve it in the Coinbase dashboard:', { chargeId: event.data?.id, orderId })
      break
    }

    case 'charge:failed':
    case 'charge:canceled': {
      const chargeId = event.data?.id
      if (orderId && typeof chargeId === 'string' && chargeId) {
        await cancelOrderAndRelease(orderId, chargeId)
      }
      console.warn('[Coinbase] Charge closed without payment:', event.data?.id)
      break
    }

    case 'charge:pending': {
      break
    }
  }
}
