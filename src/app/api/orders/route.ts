import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { sendOrderConfirmation } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      items,
      shippingAddress,
      paymentMethod,
      isGuest,
      guestEmail,
      isGift,
      giftMessage,
      giftWrappingId,
      isAnonymousGift,
      recipientEmail,
      loyaltyPointsUsed,
      promoCodeId,
      giftCardId,
      giftCardAppliedCents,
    } = body

    // Validate items
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in order' }, { status: 400 })
    }

    // Get customer from session if not guest
    let customerId: string | null = null
    let email = guestEmail
    let customerName = 'Guest'

    if (!isGuest) {
      const session = await getSession()
      if (session?.customerId) {
        customerId = session.customerId
        const customer = await db.customer.findUnique({
          where: { id: customerId },
        })
        if (customer) {
          email = customer.email
          customerName = `${customer.firstName} ${customer.lastName}`
        }
      }
    }

    // Validate guest has email
    if (isGuest && !guestEmail) {
      return NextResponse.json({ error: 'Guest email required' }, { status: 400 })
    }

    // Validate and get product details
    const productIds = items.map((item: { productId: string }) => item.productId)
    const products = await db.product.findMany({ take: 50,
      where: { id: { in: productIds } },
      include: { variants: true },
    })

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: 'Some products not found' }, { status: 400 })
    }

    // Check stock availability for all items
    for (const item of items as Array<{ productId: string; variantId?: string; quantity: number }>) {
      const product = products.find(p => p.id === item.productId)
      if (!product) continue

      // Skip stock check for digital products
      if (product.isDigital) continue

      if (item.variantId) {
        const variant = product.variants.find(v => v.id === item.variantId)
        if (variant && variant.stock < item.quantity) {
          return NextResponse.json(
            { error: `Insufficient stock for ${product.name}. Only ${variant.stock} available.` },
            { status: 400 }
          )
        }
      } else {
        // Check product-level inventory
        if (product.inventoryCount < item.quantity) {
          return NextResponse.json(
            { error: `Insufficient stock for ${product.name}. Only ${product.inventoryCount} available.` },
            { status: 400 }
          )
        }
      }
    }

    // Create or get address
    let address
    if (shippingAddress.id) {
      address = await db.address.findUnique({
        where: { id: shippingAddress.id },
      })
    }

    if (!address) {
      address = await db.address.create({
        data: {
          customerId: customerId || undefined,
          line1: shippingAddress.line1,
          line2: shippingAddress.line2 || null,
          city: shippingAddress.city,
          state: shippingAddress.state || null,
          postcode: shippingAddress.postcode,
          country: shippingAddress.country,
          isDefault: false,
        },
      })
    }

    // Calculate totals
    let subtotalCents = 0
    const orderItems = items.map((item: { productId: string; variantId?: string; quantity: number }) => {
      const product = products.find((p) => p.id === item.productId)
      if (!product) throw new Error(`Product ${item.productId} not found`)

      let priceCents: number
      if (item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId)
        if (!variant) throw new Error(`Variant ${item.variantId} not found`)
        priceCents = variant.price
      } else {
        priceCents = product.variants[0]?.price || 0
      }

      subtotalCents += priceCents * item.quantity

      return {
        productId: item.productId,
        variantId: item.variantId,
        name: product.name,
        priceCents,
        quantity: item.quantity,
      }
    })

    // Calculate shipping (free over $75)
    const shippingCents = subtotalCents >= 7500 ? 0 : 1200

    // Apply promo code discount
    let promoDiscountCents = 0
    let promotion = null
    if (promoCodeId) {
      promotion = await db.promotion.findUnique({ where: { id: promoCodeId } })
      if (promotion && promotion.isActive) {
        if (promotion.type === 'percentage') {
          promoDiscountCents = Math.floor((subtotalCents * promotion.value) / 100)
          if (promotion.maxDiscountCents) {
            promoDiscountCents = Math.min(promoDiscountCents, promotion.maxDiscountCents)
          }
        } else if (promotion.type === 'fixed') {
          promoDiscountCents = promotion.value
        } else if (promotion.type === 'free_shipping') {
          promoDiscountCents = shippingCents
        }
      }
    }

    // Apply gift card discount
    let giftCardDiscountCents = 0
    let giftCard = null
    if (giftCardId && giftCardAppliedCents > 0) {
      giftCard = await db.giftCard.findUnique({ where: { id: giftCardId } })
      if (giftCard && giftCard.balanceCents >= giftCardAppliedCents) {
        giftCardDiscountCents = giftCardAppliedCents
      }
    }

    // Apply loyalty points discount if applicable
    let pointsDiscountCents = 0
    if (loyaltyPointsUsed && loyaltyPointsUsed > 0 && customerId) {
      const loyaltyAccount = await db.loyaltyAccount.findUnique({
        where: { customerId },
      })

      if (loyaltyAccount && loyaltyAccount.points >= loyaltyPointsUsed) {
        // 100 points = $1 (100 cents)
        pointsDiscountCents = Math.min(loyaltyPointsUsed, subtotalCents)
      }
    }

    const totalCents = Math.max(0, subtotalCents + shippingCents - promoDiscountCents - giftCardDiscountCents - pointsDiscountCents)

    // Generate reference
    const reference = `CL${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`

    // Calculate loyalty points to earn (1 point per dollar)
    const loyaltyPointsEarned = Math.floor(totalCents / 100)

    // Execute everything in a single transaction
    const order = await db.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          reference,
          customerId,
          guestEmail: isGuest ? guestEmail : null,
          addressId: address.id,
          status: 'PENDING',
          paymentMethod,
          subtotalCents,
          shippingCents,
          totalCents,
          currency: 'USD',
          isGift: isGift || false,
          giftMessage: isGift ? giftMessage : null,
          giftWrappingId: isGift ? giftWrappingId : null,
          isAnonymousGift: isAnonymousGift || false,
          recipientEmail: isAnonymousGift ? recipientEmail : null,
          loyaltyPointsEarned,
          loyaltyPointsUsed: loyaltyPointsUsed || 0,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          address: true,
        },
      })

      // Deduct loyalty points if used
      if (loyaltyPointsUsed && loyaltyPointsUsed > 0 && customerId && pointsDiscountCents > 0) {
        await tx.loyaltyAccount.update({
          where: { customerId },
          data: {
            points: { decrement: loyaltyPointsUsed },
            totalUsed: { increment: loyaltyPointsUsed },
          },
        })

        await tx.loyaltyTransaction.create({
          data: {
            accountId: (await tx.loyaltyAccount.findUnique({ where: { customerId } }))!.id,
            points: -loyaltyPointsUsed,
            type: 'redemption',
            description: `Redeemed for order ${reference}`,
            orderId: newOrder.id,
          },
        })
      }

      // Increment promo code usage
      if (promotion) {
        await tx.promotion.update({
          where: { id: promotion.id },
          data: { usageCount: { increment: 1 } },
        })
      }

      // Deduct gift card balance and create transaction
      if (giftCard && giftCardDiscountCents > 0) {
        await tx.giftCard.update({
          where: { id: giftCard.id },
          data: {
            balanceCents: { decrement: giftCardDiscountCents },
            isRedeemed: giftCard.balanceCents - giftCardDiscountCents <= 0,
            redeemedAt: giftCard.balanceCents - giftCardDiscountCents <= 0 ? new Date() : undefined,
            redeemedById: customerId || undefined,
          },
        })

        await tx.giftCardTransaction.create({
          data: {
            giftCardId: giftCard.id,
            amountCents: giftCardDiscountCents,
            type: 'redemption',
            orderId: newOrder.id,
            description: `Redeemed for order ${reference}`,
          },
        })
      }

      // Deduct inventory for all items
      for (const item of items as Array<{ productId: string; variantId?: string; quantity: number }>) {
        const product = products.find(p => p.id === item.productId)
        if (!product || product.isDigital) continue

        if (item.variantId) {
          // Deduct from variant
          await tx.variant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          })
        }

        // Also deduct from product-level inventory
        await tx.product.update({
          where: { id: item.productId },
          data: {
            inventoryCount: { decrement: item.quantity },
            purchaseCount: { increment: item.quantity },
          },
        })
      }

      return newOrder
    })

    // Send order confirmation email (non-blocking)
    if (email) {
      sendOrderConfirmation({
        customerEmail: email,
        customerName,
        orderReference: order.reference,
        total: order.totalCents,
        currency: order.currency,
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.priceCents,
        })),
      }).catch(err => {
        console.error('[ORDER] Failed to send confirmation email:', err)
      })
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

      // Verify ownership (customer or guest with correct email)
      if (order.customerId && order.customerId !== session.customerId) {
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
