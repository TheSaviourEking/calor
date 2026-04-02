import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { stripe } from '@/lib/payments/stripe'
import { createSubscriptionCheckout } from '@/lib/payments/stripe-subscriptions'
import { config } from '@/lib/config'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get user's subscriptions
    const subscriptions = await db.subscription.findMany({ /* take: handled */
      where: { customerId: decoded.customerId },
      include: {
        plan: true,
        shippingAddress: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 6
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ subscriptions })
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { planId } = await request.json()

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

    const successUrl = `${config.app.baseUrl}/subscriptions`
    const cancelUrl = `${config.app.baseUrl}/subscriptions`

    const checkoutUrl = await createSubscriptionCheckout(
      decoded.customerId,
      planId,
      successUrl,
      cancelUrl
    )

    return NextResponse.json({ checkoutUrl })
  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { subscriptionId, action, reason } = await request.json()

    if (!subscriptionId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify subscription belongs to user
    const existingSub = await db.subscription.findFirst({
      where: { id: subscriptionId, customerId: decoded.customerId }
    })

    if (!existingSub) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    let updateData: any = {}

    switch (action) {
      case 'pause':
        const pauseStart = new Date()
        const pauseEnd = new Date()
        pauseEnd.setMonth(pauseEnd.getMonth() + 1)
        updateData = {
          status: 'paused',
          pauseStartDate: pauseStart,
          pauseEndDate: pauseEnd
        }
        if (existingSub.stripeSubscriptionId) {
          await stripe.subscriptions.update(existingSub.stripeSubscriptionId, {
            pause_collection: { behavior: 'void' },
          })
        }
        break

      case 'resume':
        updateData = {
          status: 'active',
          pauseStartDate: null,
          pauseEndDate: null
        }
        if (existingSub.stripeSubscriptionId) {
          await stripe.subscriptions.update(existingSub.stripeSubscriptionId, {
            pause_collection: '',
          })
        }
        break

      case 'cancel':
        updateData = {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancellationReason: reason || null,
          cancelAtPeriodEnd: true
        }
        if (existingSub.stripeSubscriptionId) {
          await stripe.subscriptions.update(existingSub.stripeSubscriptionId, {
            cancel_at_period_end: true,
          })
        }
        break
      
      case 'skip_next':
        const nextMonth = new Date()
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        const skipMonth = nextMonth.toISOString().slice(0, 7)
        await db.subscriptionSkip.create({
          data: {
            subscriptionId,
            skipMonth,
            reason: reason || null
          }
        })
        return NextResponse.json({ success: true, message: 'Next box skipped' })
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const subscription = await db.subscription.update({
      where: { id: subscriptionId },
      data: updateData,
      include: { plan: true }
    })

    return NextResponse.json({ success: true, subscription })
  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
  }
}
