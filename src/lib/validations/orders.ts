import { z } from 'zod'

const orderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1).max(99),
})

const shippingAddressSchema = z.object({
  id: z.string().optional(),
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional().nullable(),
  city: z.string().min(1, 'City is required'),
  state: z.string().optional().nullable(),
  postcode: z.string().min(1, 'Postcode is required'),
  country: z.string().min(2).max(2, 'Country must be a 2-letter code'),
})

// The buyer is derived from the session in the route, never from this body.
// guestEmail is only used when there is no session.
export const orderCreateSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'At least one item is required').max(50),
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.enum(['card', 'bank', 'crypto']),
  guestEmail: z.string().email().optional().nullable(),
  isGift: z.boolean().default(false),
  giftMessage: z.string().max(500).optional().nullable(),
  giftWrappingId: z.string().optional().nullable(),
  isAnonymousGift: z.boolean().default(false),
  recipientEmail: z.string().email().optional().nullable(),
  loyaltyPointsUsed: z.number().int().min(0).optional(),
  promoCodeId: z.string().optional().nullable(),
  giftCardId: z.string().optional().nullable(),
  giftCardAppliedCents: z.number().int().min(0).optional(),
})

export type OrderCreate = z.infer<typeof orderCreateSchema>
