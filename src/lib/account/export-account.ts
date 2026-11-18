import { db } from '@/lib/db'
import { publicDisplayName } from '@/lib/discretion'

// Everything we hold about a member, as they would recognise it. Never
// includes credentials, payment provider ids, internal staff notes, or other
// people's details (a partner appears by display name only).

// Removed wherever they appear, as a second line of defence behind the selects
const FORBIDDEN_KEYS = new Set([
  'passwordHash',
  'password',
  'token',
  'emailVerifyToken',
  'emailVerifyExpires',
  'passwordResetToken',
  'passwordResetExpires',
  'stripeCustomerId',
  'stripeSubscriptionId',
  'paymentRef',
  'googleId',
  'appleId',
  'twoFactorSecret',
  'deviceId',
  'internalNotes',
  'isInternal',
  'customerId',
  'purchaserId',
  'redeemedById',
])

function clean(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(clean)
  if (value instanceof Date) return value
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, v] of Object.entries(value)) {
      if (!FORBIDDEN_KEYS.has(key)) out[key] = clean(v)
    }
    return out
  }
  return value
}

const productName = { select: { name: true, slug: true } }
const partnerName = { select: { firstName: true, lastName: true, nickname: true } }

export async function exportAccount(customerId: string): Promise<object> {
  const c = await db.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      nickname: true,
      locale: true,
      authProvider: true,
      googleEmail: true,
      appleEmail: true,
      emailVerified: true,
      ageVerifiedAt: true,
      createdAt: true,
      addresses: {
        select: { line1: true, line2: true, city: true, state: true, postcode: true, country: true, isDefault: true },
      },
      orders: {
        orderBy: { createdAt: 'desc' },
        select: {
          reference: true,
          status: true,
          createdAt: true,
          subtotalCents: true,
          shippingCents: true,
          totalCents: true,
          currency: true,
          paymentMethod: true,
          isGift: true,
          giftMessage: true,
          recipientEmail: true,
          plainPackaging: true,
          discreetLabel: true,
          deliveryInstructions: true,
          trackingNumber: true,
          loyaltyPointsEarned: true,
          loyaltyPointsUsed: true,
          address: { select: { line1: true, line2: true, city: true, state: true, postcode: true, country: true } },
          items: { select: { name: true, priceCents: true, quantity: true, variantId: true } },
        },
      },
      reviews: {
        select: { rating: true, title: true, content: true, isApproved: true, createdAt: true, product: productName },
      },
      sharedWishlists: {
        select: { shareCode: true, title: true, description: true, productIds: true, isActive: true, createdAt: true },
      },
      giftRegistries: {
        select: {
          slug: true,
          title: true,
          description: true,
          registryType: true,
          eventDate: true,
          isPublic: true,
          status: true,
          createdAt: true,
          items: { select: { quantity: true, product: productName } },
        },
      },
      alertPreferences: {
        select: {
          priceDropAlerts: true,
          backInStockAlerts: true,
          orderUpdates: true,
          newsletter: true,
          securityAlerts: true,
          loyaltyUpdates: true,
        },
      },
      packagingPreference: {
        select: {
          senderName: true,
          senderNameEnabled: true,
          plainPackaging: true,
          discreteLabel: true,
          requireSignature: true,
          deliveryInstructions: true,
          includeGiftNote: true,
          defaultGiftMessage: true,
          preferredDeliveryDays: true,
          avoidWeekends: true,
        },
      },
      preferences: {
        select: {
          categoryAffinity: true,
          priceRange: true,
          styleTags: true,
          interests: true,
          purchaseFrequency: true,
          preferredChannel: true,
          viewHistorySummary: true,
          searchHistorySummary: true,
        },
      },
      priceDropAlerts: { select: { targetPrice: true, createdAt: true, product: productName } },
      stockAlerts: { select: { createdAt: true, product: productName } },
      loyaltyAccount: {
        select: {
          points: true,
          totalEarned: true,
          totalUsed: true,
          tier: true,
          transactions: { select: { points: true, type: true, description: true, createdAt: true } },
        },
      },
      purchasedGiftCards: {
        select: {
          initialValueCents: true,
          currency: true,
          recipientName: true,
          message: true,
          isDelivered: true,
          isRedeemed: true,
          createdAt: true,
        },
      },
      returnRequests: {
        select: {
          status: true,
          reason: true,
          reasonDetails: true,
          refundMethod: true,
          refundAmount: true,
          createdAt: true,
          order: { select: { reference: true } },
        },
      },
      subscriptions: {
        select: { status: true, startDate: true, currentPeriodEnd: true, cancelledAt: true, plan: { select: { name: true } } },
      },
      supportTickets: {
        select: {
          subject: true,
          status: true,
          createdAt: true,
          messages: {
            where: { isInternal: false },
            orderBy: { createdAt: 'asc' },
            select: { senderType: true, content: true, createdAt: true },
          },
        },
      },
      wellnessEntries: {
        select: {
          entryDate: true,
          entryType: true,
          mood: true,
          energy: true,
          stress: true,
          activities: true,
          duration: true,
          notes: true,
        },
      },
      productExperiences: {
        select: { title: true, content: true, experienceType: true, rating: true, createdAt: true, product: productName },
      },
      couplesLink1: { select: { status: true, customer2: partnerName } },
      couplesLink2: { select: { status: true, customer1: partnerName } },
    },
  })

  if (!c) return {}

  const partnerLinks = [
    ...(c.couplesLink1 ?? []).map((l) => ({ status: l.status, partner: publicDisplayName(l.customer2, 'Partner') })),
    ...(c.couplesLink2 ?? []).map((l) => ({ status: l.status, partner: publicDisplayName(l.customer1, 'Partner') })),
  ]

  return {
    exportedAt: new Date().toISOString(),
    profile: {
      id: c.id,
      email: c.email,
      firstName: c.firstName,
      lastName: c.lastName,
      nickname: c.nickname,
      locale: c.locale,
      signInMethod: c.authProvider,
      googleEmail: c.googleEmail ?? null,
      appleEmail: c.appleEmail ?? null,
      emailVerified: c.emailVerified,
      ageVerifiedAt: c.ageVerifiedAt ?? null,
      memberSince: c.createdAt,
    },
    addresses: clean(c.addresses ?? []),
    orders: clean(c.orders ?? []),
    reviews: clean(c.reviews ?? []),
    wishlists: clean(c.sharedWishlists ?? []),
    registries: clean(c.giftRegistries ?? []),
    preferences: {
      alerts: clean(c.alertPreferences ?? null),
      packaging: clean(c.packagingPreference ?? null),
      shopping: clean(c.preferences ?? null),
    },
    alerts: {
      priceDrops: clean(c.priceDropAlerts ?? []),
      backInStock: clean(c.stockAlerts ?? []),
    },
    loyalty: clean(c.loyaltyAccount ?? null),
    giftCardsPurchased: clean(c.purchasedGiftCards ?? []),
    returns: clean(c.returnRequests ?? []),
    subscriptions: clean(c.subscriptions ?? []),
    supportTickets: clean(c.supportTickets ?? []),
    wellnessEntries: clean(c.wellnessEntries ?? []),
    experiences: clean(c.productExperiences ?? []),
    partnerLinks,
  }
}
