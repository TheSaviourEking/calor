import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin/middleware'
import { sendShippingNotification } from '@/lib/email'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    
    const updateData: Record<string, unknown> = {}
    
    if (body.status) {
      updateData.status = body.status
    }
    
    if (body.trackingNumber !== undefined) {
      updateData.trackingNumber = body.trackingNumber || null
    }
    
    // If shipping, set estimated delivery
    if (body.status === 'SHIPPED') {
      const estimatedDelivery = new Date()
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 5)
      updateData.estimatedDelivery = estimatedDelivery
    }

    const order = await db.order.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        items: { include: { product: true } },
        address: true,
      },
    })

    // Send shipping notification email when order is shipped
    if (body.status === 'SHIPPED') {
      const recipientEmail = order.customer?.email || order.guestEmail
      const recipientName = order.customer?.firstName || 'Valued Customer'
      
      if (recipientEmail) {
        await sendShippingNotification({
          customerEmail: recipientEmail,
          customerName: recipientName,
          orderReference: order.reference,
          trackingNumber: order.trackingNumber || 'Tracking will be provided soon',
          estimatedDelivery: order.estimatedDelivery?.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long', 
            day: 'numeric',
          }) || '5-7 business days',
        })
      }
    }

    // Award loyalty points when order is delivered
    if (body.status === 'DELIVERED' && order.customerId && order.loyaltyPointsEarned > 0) {
      const loyaltyAccount = await db.loyaltyAccount.upsert({
        where: { customerId: order.customerId },
        create: {
          customerId: order.customerId,
          points: order.loyaltyPointsEarned,
          totalEarned: order.loyaltyPointsEarned,
        },
        update: {
          points: { increment: order.loyaltyPointsEarned },
          totalEarned: { increment: order.loyaltyPointsEarned },
        },
      })

      await db.loyaltyTransaction.create({
        data: {
          accountId: loyaltyAccount.id,
          points: order.loyaltyPointsEarned,
          type: 'purchase',
          description: `Points earned from order ${order.reference}`,
          orderId: order.id,
        },
      })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Order update error:', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const order = await db.order.findUnique({
      where: { id },
      include: {
        customer: true,
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

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Order fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}
