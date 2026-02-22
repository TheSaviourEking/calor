import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createSession } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/verify-email?error=invalid', request.url))
    }

    // Find customer by verify token
    const customer = await db.customer.findFirst({
      where: {
        emailVerifyToken: token,
        emailVerifyExpires: { gte: new Date() },
      },
    })

    if (!customer) {
      return NextResponse.redirect(new URL('/verify-email?error=invalid', request.url))
    }

    // Update customer as verified
    await db.customer.update({
      where: { id: customer.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerifyToken: null,
        emailVerifyExpires: null,
      },
    })

    // Create session
    await createSession(customer.id, customer.email)

    return NextResponse.redirect(new URL('/verify-email?success=true', request.url))
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.redirect(new URL('/verify-email?error=unknown', request.url))
  }
}
