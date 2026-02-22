import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, createSession } from '@/lib/auth/session'
import { sendSecurityAlert } from '@/lib/email'
import { getGeoInfo, parseUserAgent, formatLocation } from '@/lib/geo'

import { z } from 'zod'

const resetSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json()
    const parsed = resetSchema.safeParse(rawBody)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { token, password } = parsed.data

    // Find customer by reset token
    const customer = await db.customer.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gte: new Date() },
      },
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Hash new password
    const passwordHash = await hashPassword(password)

    // Update customer and clear reset token
    await db.customer.update({
      where: { id: customer.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    })

    // Create new session
    await createSession(customer.id, customer.email)

    // Get geo info for security alert
    const geo = await getGeoInfo()
    const userAgent = request.headers.get('user-agent') || ''
    const device = parseUserAgent(userAgent)
    const location = formatLocation(geo)

    // Send security alert
    await sendSecurityAlert({
      email: customer.email,
      type: 'password_change',
      ipAddress: geo.ip,
      location,
      device,
      timestamp: new Date(),
    })

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
