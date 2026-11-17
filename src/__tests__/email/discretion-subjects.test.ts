// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { send } = vi.hoisted(() => ({ send: vi.fn() }))

vi.mock('resend', () => ({
  Resend: class {
    emails = { send }
  },
}))
vi.mock('@/lib/config', () => ({
  config: {
    resend: { apiKey: 're_unit_test_key' },
    app: { baseUrl: 'http://localhost:3000' },
  },
}))

import {
  sendPriceDropAlert,
  sendBackInStockAlert,
  sendAbandonedCartEmail,
  sendGiftCardEmail,
  sendOrderConfirmation,
  sendShippingNotification,
  sendWelcomeEmail,
} from '@/lib/email'
import { EMAIL_SUBJECTS, STATEMENT_DESCRIPTOR } from '@/lib/discretion'

const PRODUCT = 'Wand X'
const SENDER = 'Grace Hopper'

beforeEach(() => {
  send.mockReset()
  send.mockResolvedValue({ data: { id: 'e1' }, error: null })
})

const lastCall = () => send.mock.calls[send.mock.calls.length - 1][0] as { subject: string; html: string }

describe('neutral email subjects', () => {
  it('price drop subject is neutral', async () => {
    await sendPriceDropAlert({ email: 'a@b.co', customerName: 'Ada', productName: PRODUCT, originalPrice: 5000, newPrice: 4000, productSlug: 'wand-x' })
    expect(lastCall().subject).toBe(EMAIL_SUBJECTS.priceDrop)
    expect(lastCall().subject).not.toContain(PRODUCT)
  })

  it('back in stock subject is neutral', async () => {
    await sendBackInStockAlert({ email: 'a@b.co', customerName: 'Ada', productName: PRODUCT, productSlug: 'wand-x' })
    expect(lastCall().subject).toBe(EMAIL_SUBJECTS.backInStock)
    expect(lastCall().subject).not.toContain(PRODUCT)
  })

  it('abandoned cart shows only a count, no names', async () => {
    await sendAbandonedCartEmail({
      email: 'a@b.co',
      name: 'Ada',
      cartData: { items: [{ name: PRODUCT, quantity: 1, price: 5000 }, { name: 'Secret Thing', quantity: 2, price: 1000 }], total: 7000 },
      discountCode: 'BACK10',
      discountPercent: 10,
    })
    const { subject, html } = lastCall()
    expect(subject).toBe(EMAIL_SUBJECTS.abandonedCart)
    expect(html).toContain('2 items')
    expect(html).not.toContain(PRODUCT)
    expect(html).not.toContain('Secret Thing')
    expect(html).toContain('/checkout')
  })

  it('abandoned cart uses singular for one item', async () => {
    await sendAbandonedCartEmail({
      email: 'a@b.co', name: 'Ada',
      cartData: { items: [{ name: PRODUCT, quantity: 1, price: 5000 }], total: 5000 },
      discountCode: 'X', discountPercent: 5,
    })
    expect(lastCall().html).toContain('1 item')
    expect(lastCall().html).not.toContain('1 items')
  })

  it('gift card subject is neutral and omits the sender name', async () => {
    await sendGiftCardEmail({ recipientEmail: 'r@b.co', recipientName: 'Rae', senderName: SENDER, code: 'GC-1', value: 5000 })
    expect(lastCall().subject).toBe(EMAIL_SUBJECTS.giftCard)
    expect(lastCall().subject).not.toContain(SENDER)
    expect(lastCall().html).toContain(`Card payments show ${STATEMENT_DESCRIPTOR}`)
  })

  it('order confirmation escapes item names', async () => {
    await sendOrderConfirmation({
      customerEmail: 'a@b.co', customerName: '<i>Ada</i>', orderReference: 'CAL-1', total: 1000, currency: 'USD',
      items: [{ name: '<b>x</b>', quantity: 1, price: 1000 }],
    })
    expect(lastCall().html).toContain('&lt;b&gt;x&lt;/b&gt;')
    expect(lastCall().html).not.toContain('<b>x</b>')
    expect(lastCall().html).toContain('&lt;i&gt;Ada&lt;/i&gt;')
    expect(lastCall().subject).toBe(EMAIL_SUBJECTS.orderConfirmed)
  })

  it('no subject across senders contains fixture names', async () => {
    await sendPriceDropAlert({ email: 'a@b.co', customerName: 'Ada', productName: PRODUCT, originalPrice: 5000, newPrice: 4000, productSlug: 's' })
    await sendBackInStockAlert({ email: 'a@b.co', customerName: 'Ada', productName: PRODUCT, productSlug: 's' })
    await sendAbandonedCartEmail({ email: 'a@b.co', name: 'Ada', cartData: { items: [{ name: PRODUCT, quantity: 1, price: 1 }], total: 1 }, discountCode: 'X', discountPercent: 5 })
    await sendGiftCardEmail({ recipientEmail: 'r@b.co', recipientName: 'Rae', senderName: SENDER, code: 'GC', value: 1 })
    await sendOrderConfirmation({ customerEmail: 'a@b.co', customerName: 'Ada', orderReference: 'CAL-1', total: 1, currency: 'USD', items: [{ name: PRODUCT, quantity: 1, price: 1 }] })
    await sendShippingNotification({ customerEmail: 'a@b.co', customerName: 'Ada', orderReference: 'CAL-1', trackingNumber: 'T1', estimatedDelivery: 'soon' })
    await sendWelcomeEmail('a@b.co', 'Ada')
    expect(send).toHaveBeenCalledTimes(7)
    for (const [args] of send.mock.calls) {
      expect(args.subject).not.toContain(PRODUCT)
      expect(args.subject).not.toContain(SENDER)
    }
  })
})

describe('packaging claims follow the order', () => {
  const confirmation = (plainPackaging?: boolean) =>
    sendOrderConfirmation({
      customerEmail: 'a@b.co',
      customerName: 'Ada',
      orderReference: 'CAL-1',
      total: 5000,
      currency: 'USD',
      items: [{ name: PRODUCT, quantity: 1, price: 5000 }],
      ...(plainPackaging === undefined ? {} : { plainPackaging }),
    })
  const shipping = (plainPackaging?: boolean) =>
    sendShippingNotification({
      customerEmail: 'a@b.co',
      customerName: 'Ada',
      orderReference: 'CAL-1',
      trackingNumber: 'TRK1',
      estimatedDelivery: 'Friday',
      ...(plainPackaging === undefined ? {} : { plainPackaging }),
    })

  it('order confirmation claims plain packaging by default and when true', async () => {
    await confirmation()
    expect(lastCall().html).toContain('plain, unmarked packaging')
    await confirmation(true)
    expect(lastCall().html).toContain('plain, unmarked packaging')
  })

  it('order confirmation drops the claim when the customer chose branded packaging', async () => {
    await confirmation(false)
    expect(lastCall().html).not.toContain('plain, unmarked packaging')
    expect(lastCall().html).not.toContain('unmarked')
  })

  it('shipping notification claims plain packaging by default and when true', async () => {
    await shipping()
    expect(lastCall().html).toContain('plain, unmarked packaging')
    await shipping(true)
    expect(lastCall().html).toContain('plain, unmarked packaging')
  })

  it('shipping notification drops the claim when the customer chose branded packaging', async () => {
    await shipping(false)
    expect(lastCall().html).not.toContain('unmarked')
  })

  it('abandoned cart and gift card say plain packaging is the default, not a guarantee', async () => {
    await sendAbandonedCartEmail({
      email: 'a@b.co',
      name: 'Ada',
      cartData: { items: [{ name: PRODUCT, quantity: 1, price: 5000 }], total: 5000 },
      discountCode: 'BACK10',
      discountPercent: 10,
    })
    expect(lastCall().html).toContain('Orders ship in plain packaging by default.')
    expect(lastCall().html).not.toContain('All orders ship')
    await sendGiftCardEmail({ recipientEmail: 'a@b.co', recipientName: 'Bo', senderName: SENDER, code: 'GC-1', value: 5000 })
    expect(lastCall().html).toContain('Orders ship in plain packaging by default.')
  })
})
