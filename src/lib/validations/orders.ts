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

export const orderCreateSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.enum(['card', 'bank', 'crypto']),
  isGuest: z.boolean().default(false),
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
}).refine(
  (data) => !data.isGuest || data.guestEmail,
  { message: 'Guest email is required for guest checkout', path: ['guestEmail'] }
)

export type OrderCreate = z.infer<typeof orderCreateSchema>
