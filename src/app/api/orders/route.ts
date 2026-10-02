import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { orderCreateSchema } from '@/lib/validations/orders'
import { priceOrder, OrderPricingError } from '@/lib/orders/pricing'
import { sendOrderConfirmationFor } from '@/lib/orders/lifecycle'

export async function POST(request: NextRequest) {
  try {
    const parsed = orderCreateSchema.safeParse(await request.json())

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data

    // The buyer comes from the session, never from the request body
    const session = await getSession()
    const customer = session?.customerId
      ? await db.customer.findUnique({
          where: { id: session.customerId },
          select: { id: true },
        })
      : null
    const customerId = customer?.id ?? null
    const guestEmail = customerId ? null : data.guestEmail ?? null

    if (!customerId && !guestEmail) {
      return NextResponse.json({ error: 'Email is required for guest checkout' }, { status: 400 })
    }

    const productIds = [...new Set(data.items.map((item) => item.productId))]
    const [products, promotion, giftCard, loyaltyAccount, wrapping, savedAddress] = await Promise.all([
      db.product.findMany({
        where: { id: { in: productIds }, published: true },
        include: { variants: true },
      }),
      data.promoCodeId ? db.promotion.findUnique({ where: { id: data.promoCodeId } }) : null,
      data.giftCardId ? db.giftCard.findUnique({ where: { id: data.giftCardId } }) : null,
      customerId ? db.loyaltyAccount.findUnique({ where: { customerId } }) : null,
      data.isGift && data.giftWrappingId
        ? db.giftWrappingOption.findFirst({ where: { id: data.giftWrappingId, isActive: true } })
        : null,
      // A saved address is only reused when it belongs to this customer
      data.shippingAddress.id && customerId
        ? db.address.findFirst({ where: { id: data.shippingAddress.id, customerId } })
        : null,
    ])

    if (data.promoCodeId && !promotion) {
      return NextResponse.json({ error: 'Invalid promo code', code: 'PROMO_INVALID' }, { status: 400 })
    }

    let priced
    try {
      priced = priceOrder({
        items: data.items,
        products,
        promotion,
        giftCard,
        giftCardRequestedCents: data.giftCardId ? data.giftCardAppliedCents ?? 0 : 0,
        loyaltyPointsRequested: data.loyaltyPointsUsed ?? 0,
        loyaltyPointsAvailable: loyaltyAccount?.points ?? 0,
        wrappingCents: wrapping?.priceCents ?? 0,
      })
    } catch (error) {
      if (error instanceof OrderPricingError) {
        return NextResponse.json({ error: error.message, code: error.code }, { status: 400 })
      }
      throw error
    }

    const reference = `CL${randomBytes(6).toString('hex').toUpperCase()}`
    const loyaltyPointsEarned = customerId ? priced.loyaltyPointsEarned : 0

    let order
    try {
      // Everything is reserved with conditional updates inside one transaction:
      // if any reservation loses a race, the whole order rolls back.
      order = await db.$transaction(async (tx) => {
        const address =
          savedAddress ??
          (await tx.address.create({
            data: {
              customerId,
              line1: data.shippingAddress.line1,
              line2: data.shippingAddress.line2 || null,
              city: data.shippingAddress.city,
              state: data.shippingAddress.state || null,
              postcode: data.shippingAddress.postcode,
              country: data.shippingAddress.country,
              isDefault: false,
            },
          }))

        for (const line of priced.lines) {
          if (line.isDigital) continue

          if (line.variantId) {
            const reserved = await tx.variant.updateMany({
              where: { id: line.variantId, productId: line.productId, stock: { gte: line.quantity } },
              data: { stock: { decrement: line.quantity } },
            })
            if (reserved.count !== 1) {
              throw new OrderPricingError('OUT_OF_STOCK', `${line.name} just sold out`)
            }
            await tx.product.update({
              where: { id: line.productId },
              data: {
                inventoryCount: { decrement: line.quantity },
                purchaseCount: { increment: line.quantity },
              },
            })
          } else {
            const reserved = await tx.product.updateMany({
              where: { id: line.productId, inventoryCount: { gte: line.quantity } },
              data: {
                inventoryCount: { decrement: line.quantity },
                purchaseCount: { increment: line.quantity },
              },
            })
            if (reserved.count !== 1) {
              throw new OrderPricingError('OUT_OF_STOCK', `${line.name} just sold out`)
            }
          }
        }

        if (promotion) {
          const used = await tx.promotion.updateMany({
            where: {
              id: promotion.id,
              isActive: true,
              ...(promotion.usageLimit !== null && { usageCount: { lt: promotion.usageLimit } }),
            },
            data: { usageCount: { increment: 1 } },
          })
          if (used.count !== 1) {
            throw new OrderPricingError('PROMO_INVALID', 'This promo code has reached its usage limit')
          }
        }

        if (customerId && loyaltyAccount && priced.pointsUsed > 0) {
          const spent = await tx.loyaltyAccount.updateMany({
            where: { id: loyaltyAccount.id, points: { gte: priced.pointsUsed } },
            data: {
              points: { decrement: priced.pointsUsed },
              totalUsed: { increment: priced.pointsUsed },
            },
          })
          if (spent.count !== 1) {
            throw new OrderPricingError('PROMO_INVALID', 'Your loyalty points balance changed. Please review your order.')
          }
        }

        if (giftCard && priced.giftCardDiscountCents > 0) {
          const charged = await tx.giftCard.updateMany({
            where: { id: giftCard.id, balanceCents: { gte: priced.giftCardDiscountCents } },
            data: { balanceCents: { decrement: priced.giftCardDiscountCents } },
          })
          if (charged.count !== 1) {
            throw new OrderPricingError('GIFT_CARD_INVALID', 'This gift card no longer has enough balance')
          }
          await tx.giftCard.updateMany({
            where: { id: giftCard.id, balanceCents: 0 },
            data: { isRedeemed: true, redeemedAt: new Date(), redeemedById: customerId },
          })
        }

        const newOrder = await tx.order.create({
          data: {
            reference,
            customerId,
            guestEmail,
            addressId: address.id,
            // Nothing left to pay (gift card or points covered it): no payment
            // provider is involved, so the order is confirmed with its reservations.
            status: priced.totalCents === 0 ? 'PAYMENT_RECEIVED' : 'PENDING',
            paymentMethod: data.paymentMethod,
            subtotalCents: priced.subtotalCents,
            shippingCents: priced.shippingCents,
            totalCents: priced.totalCents,
            currency: 'USD',
            isGift: data.isGift,
            giftMessage: data.isGift ? data.giftMessage ?? null : null,
            giftWrappingId: wrapping?.id ?? null,
            isAnonymousGift: data.isGift && data.isAnonymousGift,
            recipientEmail: data.isGift && data.isAnonymousGift ? data.recipientEmail ?? null : null,
            loyaltyPointsEarned,
            loyaltyPointsUsed: priced.pointsUsed,
            items: {
              create: priced.lines.map((line) => ({
                productId: line.productId,
                variantId: line.variantId,
                name: line.name,
                priceCents: line.priceCents,
                quantity: line.quantity,
              })),
            },
          },
        })

        if (customerId && loyaltyAccount && priced.pointsUsed > 0) {
          await tx.loyaltyTransaction.create({
            data: {
              accountId: loyaltyAccount.id,
              points: -priced.pointsUsed,
              type: 'redemption',
              description: `Redeemed for order ${reference}`,
              orderId: newOrder.id,
            },
          })
        }

        if (giftCard && priced.giftCardDiscountCents > 0) {
          await tx.giftCardTransaction.create({
            data: {
              giftCardId: giftCard.id,
              amountCents: priced.giftCardDiscountCents,
              type: 'redemption',
              orderId: newOrder.id,
              description: `Redeemed for order ${reference}`,
            },
          })
        }

        return newOrder
      })
    } catch (error) {
      if (error instanceof OrderPricingError) {
        return NextResponse.json({ error: error.message, code: error.code }, { status: 400 })
      }
      throw error
    }

    // A zero-total order is already confirmed; an email failure must not fail it
    if (order.totalCents === 0) {
      try {
        await sendOrderConfirmationFor(order.id)
      } catch (err) {
        console.error('[ORDER] Failed to send confirmation email:', err)
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        reference: order.reference,
        totalCents: order.totalCents,
        currency: order.currency,
        status: order.status,
      },
    })
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reference = searchParams.get('reference')

    if (reference) {
      const order = await db.order.findUnique({
        where: { reference },
        include: {
          items: {
            include: {
              product: {
                include: { images: true },
              },
            },
          },
          address: true,
        },
      })

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }

      // This endpoint requires a session, so it only ever returns the caller's own orders
      if (order.customerId !== session.customerId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }

      return NextResponse.json({ order })
    }

    // Get all orders for customer
    const orders = await db.order.findMany({ /* take: handled */
      where: { customerId: session.customerId },
      include: {
        items: {
          include: {
            product: {
              include: { images: { take: 1 } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Orders fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
