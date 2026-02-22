import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

// Get user's referral code and stats
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let referralCode = await db.referralCode.findUnique({
      where: { customerId: session.customerId },
      include: {
        referrals: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    // Create referral code if doesn't exist
    if (!referralCode) {
      const customer = await db.customer.findUnique({
        where: { id: session.customerId },
      })

      // Generate code based on customer name
      const baseCode = `${customer?.firstName?.toUpperCase() || 'REF'}${Math.random().toString(36).substring(2, 6).toUpperCase()}`

      referralCode = await db.referralCode.create({
        data: {
          code: baseCode,
          customerId: session.customerId,
        },
        include: {
          referrals: true,
        },
      })
    }

    return NextResponse.json({ referralCode })
  } catch (error) {
    console.error('Referral code fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch referral code' },
      { status: 500 }
    )
  }
}

// Create/issue referral code
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { customCode } = body

    // Check if user already has a referral code
    const existing = await db.referralCode.findUnique({
      where: { customerId: session.customerId },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'You already have a referral code', referralCode: existing },
        { status: 400 }
      )
    }

    // Generate code
    let code = customCode?.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10)
    if (!code || code.length < 4) {
      const customer = await db.customer.findUnique({
        where: { id: session.customerId },
      })
      code = `${customer?.firstName?.toUpperCase() || 'REF'}${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    }

    // Ensure uniqueness
    const codeExists = await db.referralCode.findUnique({ where: { code } })
    if (codeExists) {
      code = `${code}${Math.random().toString(36).substring(2, 4).toUpperCase()}`
    }

    const referralCode = await db.referralCode.create({
      data: {
        code,
        customerId: session.customerId,
      },
    })

    return NextResponse.json({ referralCode })
  } catch (error) {
    console.error('Referral code creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create referral code' },
      { status: 500 }
    )
  }
}
