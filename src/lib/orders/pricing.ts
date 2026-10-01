// Pure order pricing. No database or network access — callers load the rows
// and pass them in, so every rule here is unit-testable.

export const FREE_SHIPPING_THRESHOLD_CENTS = 7500
export const FLAT_SHIPPING_CENTS = 1200

export type OrderPricingErrorCode =
  | 'PRODUCT_NOT_FOUND'
  | 'VARIANT_NOT_FOUND'
  | 'NO_PRICE'
  | 'OUT_OF_STOCK'
  | 'PROMO_INVALID'
  | 'GIFT_CARD_INVALID'
  | 'INVALID_QUANTITY'

export class OrderPricingError extends Error {
  constructor(public readonly code: OrderPricingErrorCode, message: string) {
    super(message)
    this.name = 'OrderPricingError'
  }
}

export interface PricingItem {
  productId: string
  variantId?: string
  quantity: number
}

export interface PricingProduct {
  id: string
  name: string
  isDigital: boolean
  inventoryCount: number
  variants: Array<{ id: string; price: number; stock: number }>
}

export interface PricingPromotion {
  id: string
  type: string
  value: number
  isActive: boolean
  startsAt: Date
  endsAt: Date
  usageLimit: number | null
  usageCount: number
  minOrderCents: number | null
  maxDiscountCents: number | null
}

export interface PricingGiftCard {
  id: string
  balanceCents: number
  expiresAt: Date | null
  isExpired: boolean
}

export interface PriceOrderInput {
  items: PricingItem[]
  products: PricingProduct[]
  promotion?: PricingPromotion | null
  giftCard?: PricingGiftCard | null
  giftCardRequestedCents?: number
  loyaltyPointsRequested?: number
  loyaltyPointsAvailable?: number
  wrappingCents?: number
  now?: Date
}

export interface PricedLine {
  productId: string
  variantId?: string
  name: string
  priceCents: number
  quantity: number
  isDigital: boolean
}

export interface PricedOrder {
  lines: PricedLine[]
  subtotalCents: number
  shippingCents: number
  wrappingCents: number
  promoDiscountCents: number
  pointsUsed: number
  giftCardDiscountCents: number
  totalCents: number
  loyaltyPointsEarned: number
}

function nonNegativeInt(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
}

export function priceOrder(input: PriceOrderInput): PricedOrder {
  const now = input.now ?? new Date()
  // Tracks quantity wanted per stock bucket so duplicate lines are summed
  const wantedByBucket = new Map<string, number>()
  let subtotalCents = 0

  const lines = input.items.map((item): PricedLine => {
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw new OrderPricingError('INVALID_QUANTITY', 'Invalid quantity')
    }

    const product = input.products.find((p) => p.id === item.productId)
    if (!product) {
      throw new OrderPricingError('PRODUCT_NOT_FOUND', 'Some products not found')
    }

    const variant = item.variantId
      ? product.variants.find((v) => v.id === item.variantId)
      : product.variants[0]
    if (!variant) {
      throw new OrderPricingError(
        item.variantId ? 'VARIANT_NOT_FOUND' : 'NO_PRICE',
        `${product.name} is not available for purchase`
      )
    }

    if (!product.isDigital) {
      const bucket = item.variantId ? `v:${item.variantId}` : `p:${product.id}`
      const wanted = (wantedByBucket.get(bucket) ?? 0) + item.quantity
      wantedByBucket.set(bucket, wanted)
      const available = item.variantId ? variant.stock : product.inventoryCount
      if (available < wanted) {
        throw new OrderPricingError(
          'OUT_OF_STOCK',
          `Insufficient stock for ${product.name}. Only ${Math.max(available, 0)} available.`
        )
      }
    }

    subtotalCents += variant.price * item.quantity

    return {
      productId: product.id,
      variantId: item.variantId,
      name: product.name,
      priceCents: variant.price,
      quantity: item.quantity,
      isDigital: product.isDigital,
    }
  })

  const shippingCents = subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_CENTS
  const wrappingCents = nonNegativeInt(input.wrappingCents)

  let promoDiscountCents = 0
  const promo = input.promotion
  if (promo) {
    const exhausted = promo.usageLimit !== null && promo.usageCount >= promo.usageLimit
    const belowMinimum = promo.minOrderCents !== null && subtotalCents < promo.minOrderCents
    if (!promo.isActive || promo.startsAt > now || promo.endsAt < now || exhausted || belowMinimum) {
      throw new OrderPricingError('PROMO_INVALID', 'This promo code cannot be applied to this order')
    }

    if (promo.type === 'percentage') {
      promoDiscountCents = Math.floor((subtotalCents * promo.value) / 100)
      if (promo.maxDiscountCents !== null) {
        promoDiscountCents = Math.min(promoDiscountCents, promo.maxDiscountCents)
      }
      promoDiscountCents = Math.min(promoDiscountCents, subtotalCents)
    } else if (promo.type === 'fixed') {
      promoDiscountCents = Math.min(promo.value, subtotalCents)
    } else if (promo.type === 'free_shipping') {
      promoDiscountCents = shippingCents
    }
    promoDiscountCents = Math.max(0, promoDiscountCents)
  }

  let remainingCents = subtotalCents + shippingCents + wrappingCents - promoDiscountCents

  // 1 point = 1 cent
  const pointsUsed = Math.max(
    0,
    Math.min(
      nonNegativeInt(input.loyaltyPointsRequested),
      nonNegativeInt(input.loyaltyPointsAvailable),
      remainingCents
    )
  )
  remainingCents -= pointsUsed

  let giftCardDiscountCents = 0
  const giftCardRequestedCents = nonNegativeInt(input.giftCardRequestedCents)
  if (giftCardRequestedCents > 0) {
    const card = input.giftCard
    const expired = !card || card.isExpired || (card.expiresAt !== null && card.expiresAt < now)
    if (!card || expired || card.balanceCents <= 0) {
      throw new OrderPricingError('GIFT_CARD_INVALID', 'This gift card cannot be used')
    }
    giftCardDiscountCents = Math.min(giftCardRequestedCents, card.balanceCents, remainingCents)
    remainingCents -= giftCardDiscountCents
  }

  return {
    lines,
    subtotalCents,
    shippingCents,
    wrappingCents,
    promoDiscountCents,
    pointsUsed,
    giftCardDiscountCents,
    totalCents: remainingCents,
    loyaltyPointsEarned: Math.floor(remainingCents / 100),
  }
}
