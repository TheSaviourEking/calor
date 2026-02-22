import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { sendVerificationEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    // Get email from session or request body
    let email: string | null = null
    let customerId: string | null = null

    if (session?.customerId) {
      const customer = await db.customer.findUnique({
        where: { id: session.customerId },
      })
      if (customer) {
        email = customer.email
        customerId = customer.id
      }
    } else {
      const body = await request.json()
      email = body.email
      if (email) {
        const customer = await db.customer.findUnique({
          where: { email: email.toLowerCase() },
        })
        if (customer) {
          customerId = customer.id
        }
      }
    }

    if (!email || !customerId) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if already verified
    const customer = await db.customer.findUnique({
      where: { id: customerId },
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    if (customer.emailVerified) {
      return NextResponse.json({
        success: true,
        message: 'Email is already verified',
      })
    }

    // Generate verification token
    const verifyToken = crypto.randomBytes(32).toString('hex')
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Update customer with verify token
    await db.customer.update({
      where: { id: customerId },
      data: {
        emailVerifyToken: verifyToken,
        emailVerifyExpires: verifyExpires,
      },
    })

    // Send verification email
    await sendVerificationEmail({
      email: customer.email,
      customerName: customer.firstName,
      verifyToken,
    })

    return NextResponse.json({
      success: true,
      message: 'Verification email sent',
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
