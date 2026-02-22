import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { returnCreateSchema, returnUpdateSchema } from '@/lib/validations/returns'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    // 1. Authenticate FIRST
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    const baseQuery = orderId
      ? { orderId, customerId: session.customerId }
      : { customerId: session.customerId }

    // 2. Exact Select fields mapped to Client requirements (fixes data exposure & recursive includes)
    const returns = await db.returnRequest.findMany({
      take: 50,
      where: baseQuery,
      select: {
        id: true,
        status: true,
        reason: true,
        reasonDetails: true,
        refundMethod: true,
        refundAmount: true,
        trackingNumber: true,
        createdAt: true,
        order: { select: { reference: true } },
        items: { select: { id: true, quantity: true, condition: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ returns })
  } catch (error) {
    console.error('Error fetching returns:', error)
    return NextResponse.json({ error: 'Failed to fetch returns' }, { status: 500 })
  }
}

// Create new return request
export async function POST(request: NextRequest) {
  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 })
    }

    const result = returnCreateSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { orderId, reason, reasonDetails, refundMethod, items, guestEmail } = result.data

    const session = await getSession()
    const customerId = session?.customerId || null

    // Verify order exists
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Verify ownership
    if (customerId && order.customerId !== customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Calculate refund amount
    let totalRefund = 0
    const returnItems = items.map((item: { orderItemId: string; quantity: number; condition?: string }) => {
      const orderItem = order.items.find(i => i.id === item.orderItemId)
      if (orderItem) {
        totalRefund += orderItem.priceCents * item.quantity
      }
      return {
        orderItemId: item.orderItemId,
        quantity: item.quantity,
        condition: item.condition || 'unopened'
      }
    })

    // Create return request
    const returnRequest = await db.returnRequest.create({
      data: {
        orderId,
        customerId,
        guestEmail: guestEmail || order.guestEmail,
        reason,
        reasonDetails,
        refundMethod,
        refundAmount: totalRefund,
        items: {
          create: returnItems
        }
      },
      include: {
        items: true,
        order: true
      }
    })

    return NextResponse.json({
      success: true,
      returnRequest,
      message: 'Return request submitted successfully. We will review and respond within 1-2 business days.'
    })
  } catch (error) {
    console.error('Error creating return:', error)
    return NextResponse.json({ error: 'Failed to create return request' }, { status: 500 })
  }
}

// Update return status (for admin or customer actions)
export async function PUT(request: NextRequest) {
  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 })
    }

    const result = returnUpdateSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { returnId, action, trackingNumber } = result.data

    const session = await getSession()
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existingReturn = await db.returnRequest.findUnique({
      where: { id: returnId }
    })

    if (!existingReturn) {
      return NextResponse.json({ error: 'Return not found' }, { status: 404 })
    }

    // Only allow customer to add tracking
    if (action === 'add_tracking' && trackingNumber) {
      const updated = await db.returnRequest.update({
        where: { id: returnId },
        data: { trackingNumber }
      })
      return NextResponse.json({ success: true, returnRequest: updated })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating return:', error)
    return NextResponse.json({ error: 'Failed to update return' }, { status: 500 })
  }
}
