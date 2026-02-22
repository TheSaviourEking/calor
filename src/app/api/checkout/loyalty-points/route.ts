import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

// GET /api/checkout/loyalty-points - Get customer's available points for checkout
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ points: 0, pointsValue: 0 })
    }

    const loyaltyAccount = await db.loyaltyAccount.findUnique({
      where: { customerId: session.customerId },
    })

    if (!loyaltyAccount) {
      return NextResponse.json({ points: 0, pointsValue: 0 })
    }

    // 100 points = $1 (100 cents)
    const pointsValue = Math.floor(loyaltyAccount.points / 100) * 100 // in cents

    return NextResponse.json({
      points: loyaltyAccount.points,
      pointsValue, // Maximum discount value in cents
      tier: loyaltyAccount.tier,
    })
  } catch (error) {
    console.error('Error fetching loyalty points:', error)
    return NextResponse.json({ points: 0, pointsValue: 0 })
  }
}
