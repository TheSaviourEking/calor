import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

// Validate and apply referral code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      )
    }

    const referralCode = await db.referralCode.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        customer: {
          select: { firstName: true },
        },
      },
    })

    if (!referralCode || !referralCode.isActive) {
      return NextResponse.json(
        { valid: false, error: 'Invalid referral code' },
        { status: 404 }
      )
    }

    // Check if user is trying to use their own code
    const session = await getSession()
    if (session?.customerId === referralCode.customerId) {
      return NextResponse.json(
        { valid: false, error: 'You cannot use your own referral code' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      referral: {
        code: referralCode.code,
        referrerName: referralCode.customer.firstName,
        // Referral reward: $10 off for both parties
        discountCents: 1000,
        referrerReward: 1000, // $10 credit for referrer
      },
    })
  } catch (error) {
    console.error('Referral validation error:', error)
    return NextResponse.json(
      { error: 'Failed to validate referral code' },
      { status: 500 }
    )
  }
}
