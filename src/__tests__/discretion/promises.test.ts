// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const { db, intentsCreate } = vi.hoisted(() => ({
  db: { order: { findUnique: vi.fn(), updateMany: vi.fn(), update: vi.fn() } },
  intentsCreate: vi.fn(),
}))

vi.mock('@/lib/db', () => ({ db }))
vi.mock('@/lib/orders/lifecycle', () => ({ markOrderPaid: vi.fn(), cancelOrderAndRelease: vi.fn() }))
vi.mock('stripe', () => ({
  default: class {
    paymentIntents = { create: intentsCreate, retrieve: vi.fn(), cancel: vi.fn() }
  },
}))

import { createPaymentIntent } from '@/lib/payments/stripe'
import { DISCRETION_COPY, packagingNotice } from '@/lib/discretion'

describe('Stripe card descriptor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    db.order.findUnique.mockResolvedValue({
      id: 'o1', reference: 'CLX', status: 'PENDING', totalCents: 1000, currency: 'USD',
      paymentProvider: null, paymentRef: null,
    })
    db.order.updateMany.mockResolvedValue({ count: 1 })
    intentsCreate.mockResolvedValue({ id: 'pi_1', client_secret: 'sec' })
  })

  it('sends neither descriptor field; the account-level descriptor prints alone', async () => {
    await createPaymentIntent('o1')
    const args = intentsCreate.mock.calls[0][0]
    expect(args).not.toHaveProperty('statement_descriptor')
    expect(args).not.toHaveProperty('statement_descriptor_suffix')
  })
})

describe('DISCRETION_COPY', () => {
  afterEach(() => {
    delete process.env.SHIP_FROM_NAME
  })
  it('states what the code does', () => {
    expect(DISCRETION_COPY.cardStatement).toBe(
      'Card payments show CALO CO on your statement. Your bank decides the exact layout.'
    )
    expect(DISCRETION_COPY.crypto).toBe('Crypto payments show no card statement line.')
    expect(DISCRETION_COPY.bankTransfer('CALO LTD')).toBe('Bank transfers go to an account named CALO LTD.')
    expect(DISCRETION_COPY.bankTransfer()).toContain('payment instructions')
    process.env.SHIP_FROM_NAME = 'Acme Dispatch'
    expect(DISCRETION_COPY.packaging()).toContain('Acme Dispatch')
  })
  it('is frozen', () => {
    expect(Object.isFrozen(DISCRETION_COPY)).toBe(true)
  })
})

const FILES = [
  'src/lib/payments/stripe.ts',
  'src/app/legal/discreet-billing/page.tsx',
  'src/app/legal/privacy/page.tsx',
  'src/app/legal/cookies/page.tsx',
  'src/app/our-story/page.tsx',
  'src/components/home/PaymentTrust.tsx',
  'src/components/cart/CartDrawer.tsx',
  'src/app/checkout/CheckoutClient.tsx',
  'src/app/product/[slug]/ProductDetailClient.tsx',
  'src/app/gift-cards/GiftCardsClient.tsx',
  'src/app/api/chatbot/route.ts',
  'prisma/seed.ts',
]

describe('copy source scan', () => {
  const read = (f: string) => readFileSync(join(process.cwd(), f), 'utf8')
  for (const f of FILES) {
    it(`${f} makes no false promises`, () => {
      const src = read(f)
      expect(src).not.toMatch(/CALO CO\./)
      expect(src).not.toMatch(/billing name/i)
      expect(src).not.toMatch(/different name/i)
      expect(src).not.toMatch(/Incognito/i)
      expect(src).not.toContain('No product names or descriptions are ever visible')
      expect(src).not.toContain('CC Fulfillment')
    })
  }
})

describe('plain packaging promises', () => {
  const read = (f: string) => readFileSync(join(process.cwd(), f), 'utf8')

  it('packagingNotice follows the order', () => {
    expect(packagingNotice(true)).toBe('Your order will arrive in plain, unmarked packaging.')
    expect(packagingNotice(false)).toBeNull()
  })

  it('DISCRETION_COPY.packaging says plain is the default', () => {
    expect(DISCRETION_COPY.packaging()).toContain('in plain packaging by default')
  })

  for (const f of [
    'src/app/order/[reference]/page.tsx',
    'src/app/checkout/confirmation/page.tsx',
    'src/app/checkout/payment/page.tsx',
  ]) {
    it(`${f} only promises a plain box when the order has one`, () => {
      const src = read(f)
      expect(src).toContain('packagingNotice(')
      expect(src).not.toMatch(/plain,\s+unmarked/)
    })
  }

  // Marketing copy: any sentence that promises plain packaging says it is the default
  const MARKETING = [
    'src/app/our-story/page.tsx',
    'src/app/legal/terms/page.tsx',
    'src/app/shop/bundles/BundlesClient.tsx',
    'src/app/subscriptions/SubscriptionsClient.tsx',
    'src/app/product/[slug]/ProductDetailClient.tsx',
  ]
  for (const f of MARKETING) {
    it(`${f} says plain packaging is the default`, () => {
      const text = read(f).replace(/\{" "\}/g, ' ').replace(/\s+/g, ' ')
      const sentences = text.split(/(?<=[.!?])\s|[>"']/).filter((x) => /plain(,| packaging| box)/i.test(x))
      expect(sentences.length).toBeGreaterThan(0)
      for (const sentence of sentences) expect(sentence).toMatch(/by default/)
    })
  }

  it('our story uses STATEMENT_DESCRIPTOR and a proper crypto sentence', () => {
    const src = read('src/app/our-story/page.tsx')
    expect(src).not.toContain('CALO CO')
    expect(src).toContain('STATEMENT_DESCRIPTOR')
    expect(src).not.toContain(', Crypto payments')
  })
})
