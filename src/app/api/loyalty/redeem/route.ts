import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

// POST - Redeem loyalty points
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { points } = await request.json()

    if (!points || points < 100) {
      return NextResponse.json({ error: 'Minimum 100 points required for redemption' }, { status: 400 })
    }

    const loyaltyAccount = await db.loyaltyAccount.findUnique({
      where: { customerId: session.customerId },
    })

    if (!loyaltyAccount) {
      return NextResponse.json({ error: 'Loyalty account not found' }, { status: 404 })
    }

    if (loyaltyAccount.points < points) {
      return NextResponse.json({ error: 'Insufficient points' }, { status: 400 })
    }

    // Calculate discount (100 points = $1 = 100 cents)
    const discountCents = Math.floor(points / 100) * 100

    // Create transaction record
    await db.loyaltyTransaction.create({
      data: {
        accountId: loyaltyAccount.id,
        points: -points,
        type: 'redemption',
        description: `Redeemed ${points} points for $${(discountCents / 100).toFixed(2)} credit`,
      },
    })

    // Update account
    const updated = await db.loyaltyAccount.update({
      where: { id: loyaltyAccount.id },
      data: {
        points: { decrement: points },
        totalUsed: { increment: points },
      },
    })

    return NextResponse.json({
      success: true,
      redemption: {
        pointsUsed: points,
        discountCents,
        remainingPoints: updated.points,
      },
    })
  } catch (error) {
    console.error('Error redeeming points:', error)
    return NextResponse.json({ error: 'Failed to redeem points' }, { status: 500 })
  }
}
