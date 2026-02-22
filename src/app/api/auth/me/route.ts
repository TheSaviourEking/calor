import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'

// GET /api/auth/me - Get current logged in customer
export async function GET() {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated', customer: null },
        { status: 401 }
      )
    }

    const customer = await db.customer.findUnique({
      where: { id: session.customerId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isAdmin: true,
        emailVerified: true,
        ageVerifiedAt: true,
      },
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found', customer: null },
        { status: 404 }
      )
    }

    return NextResponse.json({ customer })
  } catch (error) {
    console.error('Error fetching current user:', error)
    return NextResponse.json(
      { error: 'Something went wrong', customer: null },
      { status: 500 }
    )
  }
}
