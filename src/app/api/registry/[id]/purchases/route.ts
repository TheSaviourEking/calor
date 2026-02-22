import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/registry/[id]/purchases - List purchases
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await getSession()
    
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const registry = await db.giftRegistry.findFirst({
      where: { id, customerId: session.customerId },
    })

    if (!registry) {
      return NextResponse.json({ error: 'Registry not found' }, { status: 404 })
    }

    const purchases = await db.registryPurchase.findMany({ take: 50,
      where: { registryId: id },
      include: {
        registryItem: {
          select: {
            name: true,
            price: true,
          },
        },
      },
      orderBy: { purchasedAt: 'desc' },
    })

    return NextResponse.json({ purchases })
  } catch (error) {
    console.error('Error fetching purchases:', error)
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 })
  }
}

// POST /api/registry/[id]/purchases - Record purchase (for public gift buying)
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params

    // This endpoint is public (no auth required) for gift givers
    const registry = await db.giftRegistry.findUnique({
      where: { id },
    })

    if (!registry || registry.status !== 'active') {
      return NextResponse.json({ error: 'Registry not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      registryItemId,
      purchaserName,
      purchaserEmail,
      purchaserPhone,
      quantity,
      amountCents,
      giftMessage,
      isAnonymous,
      orderId,
    } = body

    // Create purchase record
    const purchase = await db.registryPurchase.create({
      data: {
        registryId: id,
        registryItemId,
        purchaserName: isAnonymous ? 'Anonymous' : purchaserName,
        purchaserEmail,
        purchaserPhone,
        quantity: quantity || 1,
        amountCents,
        giftMessage,
        isAnonymous: isAnonymous ?? false,
        orderId,
      },
    })

    // Update item's purchased count
    await db.registryItem.update({
      where: { id: registryItemId },
      data: {
        purchasedCount: { increment: quantity || 1 },
      },
    })

    return NextResponse.json({ purchase })
  } catch (error) {
    console.error('Error recording purchase:', error)
    return NextResponse.json({ error: 'Failed to record purchase' }, { status: 500 })
  }
}

// PUT /api/registry/[id]/purchases - Mark as thanked
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await getSession()
    
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const registry = await db.giftRegistry.findFirst({
      where: { id, customerId: session.customerId },
    })

    if (!registry) {
      return NextResponse.json({ error: 'Registry not found' }, { status: 404 })
    }

    const body = await request.json()
    const { purchaseId, thankedAt } = body

    const purchase = await db.registryPurchase.update({
      where: { id: purchaseId, registryId: id },
      data: {
        thankedAt: thankedAt ? new Date(thankedAt) : new Date(),
      },
    })

    return NextResponse.json({ purchase })
  } catch (error) {
    console.error('Error updating purchase:', error)
    return NextResponse.json({ error: 'Failed to update purchase' }, { status: 500 })
  }
}
