import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendAbandonedCartEmail } from '@/lib/email'

// Track abandoned carts - called when user leaves checkout without completing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, customerId, email, cartData } = body

    if (!sessionId || !cartData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if abandoned cart already exists for this session
    const existing = await db.abandonedCart.findUnique({
      where: { sessionId },
    })

    if (existing) {
      // Update existing cart
      const updated = await db.abandonedCart.update({
        where: { sessionId },
        data: {
          customerId: customerId || existing.customerId,
          email: email || existing.email,
          cartData: JSON.stringify(cartData),
          updatedAt: new Date(),
        },
      })
      return NextResponse.json({ abandonedCart: updated })
    }

    // Create new abandoned cart
    const abandonedCart = await db.abandonedCart.create({
      data: {
        sessionId,
        customerId: customerId || null,
        email: email || null,
        cartData: JSON.stringify(cartData),
      },
    })

    return NextResponse.json({ abandonedCart })
  } catch (error) {
    console.error('Abandoned cart track error:', error)
    return NextResponse.json(
      { error: 'Failed to track abandoned cart' },
      { status: 500 }
    )
  }
}

// Get abandoned carts (for admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}
    
    if (status === 'unrecovered') {
      where.recovered = false
      where.email = { not: null }
    } else if (status === 'recovered') {
      where.recovered = true
    }

    const carts = await db.abandonedCart.findMany({ /* take: handled */
      where,
      include: {
        customer: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Parse cart data
    const parsedCarts = carts.map(cart => ({
      ...cart,
      cartData: JSON.parse(cart.cartData),
    }))

    return NextResponse.json({ abandonedCarts: parsedCarts })
  } catch (error) {
    console.error('Abandoned carts fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch abandoned carts' },
      { status: 500 }
    )
  }
}
