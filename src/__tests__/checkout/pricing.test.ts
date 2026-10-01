import { describe, it, expect } from 'vitest'
import { priceOrder, OrderPricingError } from '@/lib/orders/pricing'

const now = new Date('2026-10-01T12:00:00Z')

const product = {
  id: 'p1',
  name: 'Warm Touch Wand',
  isDigital: false,
  inventoryCount: 5,
  variants: [{ id: 'v1', price: 5000, stock: 5 }],
}

const base = {
  items: [{ productId: 'p1', variantId: 'v1', quantity: 1 }],
  products: [product],
  now,
}

const promo = {
  id: 'promo1',
  type: 'percentage',
  value: 10,
  isActive: true,
  startsAt: new Date('2026-09-01T00:00:00Z'),
  endsAt: new Date('2026-12-01T00:00:00Z'),
  usageLimit: null,
  usageCount: 0,
  minOrderCents: null,
  maxDiscountCents: null,
}

function codeOf(fn: () => unknown): string | undefined {
  try {
    fn()
  } catch (e) {
    if (e instanceof OrderPricingError) return e.code
    throw e
  }
  return undefined
}

describe('priceOrder', () => {
  it('charges the variant price plus flat shipping below the free-shipping threshold', () => {
    const priced = priceOrder(base)
    expect(priced.subtotalCents).toBe(5000)
    expect(priced.shippingCents).toBe(1200)
    expect(priced.totalCents).toBe(6200)
    expect(priced.lines[0]).toMatchObject({ productId: 'p1', variantId: 'v1', priceCents: 5000, quantity: 1 })
  })

  it('ships free at 7500 cents and above', () => {
    const priced = priceOrder({ ...base, items: [{ productId: 'p1', variantId: 'v1', quantity: 2 }] })
    expect(priced.subtotalCents).toBe(10000)
    expect(priced.shippingCents).toBe(0)
  })

  it('rejects a quantity above variant stock', () => {
    expect(codeOf(() => priceOrder({ ...base, items: [{ productId: 'p1', variantId: 'v1', quantity: 6 }] }))).toBe('OUT_OF_STOCK')
  })

  it('rejects the same variant on two lines when the combined quantity exceeds stock', () => {
    const items = [
      { productId: 'p1', variantId: 'v1', quantity: 3 },
      { productId: 'p1', variantId: 'v1', quantity: 3 },
    ]
    expect(codeOf(() => priceOrder({ ...base, items }))).toBe('OUT_OF_STOCK')
  })

  it('does not check stock for digital products', () => {
    const digital = { ...product, isDigital: true, inventoryCount: 0, variants: [{ id: 'v1', price: 900, stock: 0 }] }
    const priced = priceOrder({ ...base, products: [digital] })
    expect(priced.subtotalCents).toBe(900)
  })

  it('rejects an unknown product, an unknown variant, and a product with no price', () => {
    expect(codeOf(() => priceOrder({ ...base, products: [] }))).toBe('PRODUCT_NOT_FOUND')
    expect(codeOf(() => priceOrder({ ...base, items: [{ productId: 'p1', variantId: 'nope', quantity: 1 }] }))).toBe('VARIANT_NOT_FOUND')
    expect(codeOf(() => priceOrder({ ...base, items: [{ productId: 'p1', quantity: 1 }], products: [{ ...product, variants: [] }] }))).toBe('NO_PRICE')
  })

  it('applies a percentage promo and honours maxDiscountCents', () => {
    expect(priceOrder({ ...base, promotion: promo }).promoDiscountCents).toBe(500)
    expect(priceOrder({ ...base, promotion: { ...promo, value: 50, maxDiscountCents: 1000 } }).promoDiscountCents).toBe(1000)
  })

  it('never lets a fixed promo exceed the subtotal', () => {
    const priced = priceOrder({ ...base, promotion: { ...promo, type: 'fixed', value: 99999 } })
    expect(priced.promoDiscountCents).toBe(5000)
    expect(priced.totalCents).toBe(1200)
  })

  it('treats a free_shipping promo as a discount equal to shipping', () => {
    const priced = priceOrder({ ...base, promotion: { ...promo, type: 'free_shipping', value: 0 } })
    expect(priced.promoDiscountCents).toBe(1200)
    expect(priced.totalCents).toBe(5000)
  })

  it('rejects inactive, not-yet-started, expired, exhausted and below-minimum promos', () => {
    const bad = [
      { ...promo, isActive: false },
      { ...promo, startsAt: new Date('2026-11-01T00:00:00Z') },
      { ...promo, endsAt: new Date('2026-09-15T00:00:00Z') },
      { ...promo, usageLimit: 1, usageCount: 1 },
      { ...promo, minOrderCents: 6000 },
    ]
    for (const promotion of bad) {
      expect(codeOf(() => priceOrder({ ...base, promotion }))).toBe('PROMO_INVALID')
    }
  })

  it('clamps loyalty points to the balance and to what is left to pay', () => {
    expect(priceOrder({ ...base, loyaltyPointsRequested: 1000, loyaltyPointsAvailable: 300 }).pointsUsed).toBe(300)
    expect(priceOrder({ ...base, loyaltyPointsRequested: 999999, loyaltyPointsAvailable: 999999 }).pointsUsed).toBe(6200)
    expect(priceOrder({ ...base, loyaltyPointsRequested: 500 }).pointsUsed).toBe(0)
    expect(priceOrder({ ...base, loyaltyPointsRequested: -50, loyaltyPointsAvailable: 300 }).pointsUsed).toBe(0)
  })

  it('clamps a gift card to its balance and to what is left to pay', () => {
    const card = { id: 'g1', balanceCents: 2000, expiresAt: null, isExpired: false }
    expect(priceOrder({ ...base, giftCard: card, giftCardRequestedCents: 5000 }).giftCardDiscountCents).toBe(2000)
    const rich = { ...card, balanceCents: 100000 }
    const priced = priceOrder({ ...base, giftCard: rich, giftCardRequestedCents: 100000 })
    expect(priced.giftCardDiscountCents).toBe(6200)
    expect(priced.totalCents).toBe(0)
  })

  it('rejects a missing, empty or expired gift card when one was requested', () => {
    const card = { id: 'g1', balanceCents: 2000, expiresAt: null, isExpired: false }
    expect(codeOf(() => priceOrder({ ...base, giftCard: null, giftCardRequestedCents: 100 }))).toBe('GIFT_CARD_INVALID')
    expect(codeOf(() => priceOrder({ ...base, giftCard: { ...card, balanceCents: 0 }, giftCardRequestedCents: 100 }))).toBe('GIFT_CARD_INVALID')
    expect(codeOf(() => priceOrder({ ...base, giftCard: { ...card, isExpired: true }, giftCardRequestedCents: 100 }))).toBe('GIFT_CARD_INVALID')
    expect(codeOf(() => priceOrder({ ...base, giftCard: { ...card, expiresAt: new Date('2026-01-01T00:00:00Z') }, giftCardRequestedCents: 100 }))).toBe('GIFT_CARD_INVALID')
  })

  it('adds gift wrapping to the total and earns 1 point per whole dollar paid', () => {
    const priced = priceOrder({ ...base, wrappingCents: 550 })
    expect(priced.wrappingCents).toBe(550)
    expect(priced.totalCents).toBe(6750)
    expect(priced.loyaltyPointsEarned).toBe(67)
  })

  it('applies promo, then points, then gift card', () => {
    const card = { id: 'g1', balanceCents: 10000, expiresAt: null, isExpired: false }
    const priced = priceOrder({
      ...base,
      promotion: promo,
      loyaltyPointsRequested: 700,
      loyaltyPointsAvailable: 700,
      giftCard: card,
      giftCardRequestedCents: 10000,
    })
    expect(priced.promoDiscountCents).toBe(500)
    expect(priced.pointsUsed).toBe(700)
    expect(priced.giftCardDiscountCents).toBe(5000)
    expect(priced.totalCents).toBe(0)
  })
})
