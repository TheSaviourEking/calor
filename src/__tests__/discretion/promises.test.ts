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
import { STATEMENT_DESCRIPTOR, DISCRETION_COPY } from '@/lib/discretion'

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

  it('uses statement_descriptor_suffix (card-valid), never statement_descriptor', async () => {
    await createPaymentIntent('o1')
    const args = intentsCreate.mock.calls[0][0]
    expect(args.statement_descriptor_suffix).toBe(STATEMENT_DESCRIPTOR)
    expect(args).not.toHaveProperty('statement_descriptor')
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
