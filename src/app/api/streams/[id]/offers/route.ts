import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/streams/[id]/offers - Get offers for a stream
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const offers = await db.streamOffer.findMany({ /* take: handled */
      where: { streamId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: { take: 1 },
            variants: { take: 1 },
          },
        },
      },
    })

    return NextResponse.json({ offers })
  } catch (error) {
    console.error('Error fetching stream offers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stream offers' },
      { status: 500 }
    )
  }
}

// POST /api/streams/[id]/offers - Create an offer for stream
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      title,
      description,
      type,
      productId,
      discountType,
      discountValue,
      originalPrice,
      offerPrice,
      quantityLimit,
      perCustomerLimit,
      startsAt,
      endsAt,
      durationMinutes,
      promoCode,
      autoApply,
    } = body

    const offer = await db.streamOffer.create({
      data: {
        streamId: id,
        title,
        description,
        type: type || 'flash_sale',
        productId,
        discountType: discountType || 'percentage',
        discountValue: discountValue || 0,
        originalPrice,
        offerPrice,
        quantityLimit,
        perCustomerLimit,
        startsAt: startsAt ? new Date(startsAt) : new Date(),
        endsAt: endsAt ? new Date(endsAt) : new Date(Date.now() + 60 * 60 * 1000), // Default 1 hour
        durationMinutes,
        promoCode,
        autoApply: autoApply || false,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ offer }, { status: 201 })
  } catch (error) {
    console.error('Error creating offer:', error)
    return NextResponse.json(
      { error: 'Failed to create offer' },
      { status: 500 }
    )
  }
}
