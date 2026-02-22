import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendPasswordResetEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find customer by email
    const customer = await db.customer.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Don't reveal if email exists or not
    if (!customer) {
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, we have sent a password reset link.',
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Update customer with reset token
    await db.customer.update({
      where: { id: customer.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    })

    // Send reset email
    await sendPasswordResetEmail({
      email: customer.email,
      customerName: customer.firstName,
      resetToken,
    })

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, we have sent a password reset link.',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
