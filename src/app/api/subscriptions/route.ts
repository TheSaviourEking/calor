import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'

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

    const { planId, shippingAddressId, preferences } = await request.json()

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

    // Get plan details
    const plan = await db.subscriptionPlan.findUnique({
      where: { id: planId }
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Calculate dates
    const startDate = new Date()
    const currentPeriodEnd = new Date()
    if (plan.interval === 'monthly') {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + plan.intervalCount)
    } else if (plan.interval === 'quarterly') {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 3)
    } else {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1)
    }

    // Create subscription
    const subscription = await db.subscription.create({
      data: {
        customerId: decoded.customerId,
        planId,
        shippingAddressId: shippingAddressId || null,
        status: 'active',
        startDate,
        currentPeriodStart: startDate,
        currentPeriodEnd,
        preferences: preferences ? JSON.stringify(preferences) : null,
        nextBoxDate: startDate
      },
      include: {
        plan: true,
        shippingAddress: true
      }
    })

    return NextResponse.json({ 
      success: true, 
      subscription,
      message: 'Subscription created successfully!'
    })
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
        break
      
      case 'resume':
        updateData = {
          status: 'active',
          pauseStartDate: null,
          pauseEndDate: null
        }
        break
      
      case 'cancel':
        updateData = {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancellationReason: reason || null,
          cancelAtPeriodEnd: true
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
