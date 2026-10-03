import { describe, it, expect } from 'vitest'
import { orderCreateSchema } from '@/lib/validations/orders'

const validOrder = {
  items: [
    { productId: 'prod_1', quantity: 2 },
  ],
  shippingAddress: {
    line1: '123 Main St',
    city: 'London',
    postcode: 'SW1A 1AA',
    country: 'GB',
  },
  paymentMethod: 'card' as const,
  isGuest: false,
}

describe('Order Validation', () => {
  it('should accept a valid order', () => {
    const result = orderCreateSchema.safeParse(validOrder)
    expect(result.success).toBe(true)
  })

  it('should reject an order with empty items array', () => {
    const result = orderCreateSchema.safeParse({
      ...validOrder,
      items: [],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const itemsError = result.error.issues.find((i) => i.path.includes('items'))
      expect(itemsError).toBeDefined()
    }
  })

  it('should reject an invalid payment method', () => {
    const result = orderCreateSchema.safeParse({
      ...validOrder,
      paymentMethod: 'paypal',
    })
    expect(result.success).toBe(false)
  })

  it('should accept valid payment methods: card, bank, crypto', () => {
    for (const method of ['card', 'bank', 'crypto'] as const) {
      const result = orderCreateSchema.safeParse({
        ...validOrder,
        paymentMethod: method,
      })
      expect(result.success).toBe(true)
    }
  })

  it('should reject a malformed guestEmail', () => {
    const result = orderCreateSchema.safeParse({
      ...validOrder,
      guestEmail: 'not-an-email',
    })
    expect(result.success).toBe(false)
  })

  it('should accept a guestEmail and drop any client-supplied isGuest flag', () => {
    const result = orderCreateSchema.safeParse({
      ...validOrder,
      isGuest: true,
      guestEmail: 'guest@example.com',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect('isGuest' in result.data).toBe(false)
    }
  })

  it('should reject quantity of 0', () => {
    const result = orderCreateSchema.safeParse({
      ...validOrder,
      items: [{ productId: 'prod_1', quantity: 0 }],
    })
    expect(result.success).toBe(false)
  })

  it('should reject quantity over 99', () => {
    const result = orderCreateSchema.safeParse({
      ...validOrder,
      items: [{ productId: 'prod_1', quantity: 100 }],
    })
    expect(result.success).toBe(false)
  })

  it('should accept quantity at boundaries (1 and 99)', () => {
    for (const quantity of [1, 99]) {
      const result = orderCreateSchema.safeParse({
        ...validOrder,
        items: [{ productId: 'prod_1', quantity }],
      })
      expect(result.success).toBe(true)
    }
  })

  it('should require country to be a 2-letter code', () => {
    const result = orderCreateSchema.safeParse({
      ...validOrder,
      shippingAddress: {
        ...validOrder.shippingAddress,
        country: 'GBR',
      },
    })
    expect(result.success).toBe(false)
  })
})
