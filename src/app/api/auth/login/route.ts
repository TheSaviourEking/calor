import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, createSession } from '@/lib/auth/session'
import { sendSecurityAlert } from '@/lib/email'
import { getGeoInfo, parseUserAgent, formatLocation } from '@/lib/geo'

import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

// A dummy hash to prevent timing attacks. This is the hash for "dummy_password".
const DUMMY_HASH = '$2a$10$U.9Y.o2g9Qf.P55.sB1oD.24w0uH75B9U8c/2F6D1F1u/T1h7H9nK'

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json()
    const parsed = loginSchema.safeParse(rawBody)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, password } = parsed.data

    // Find customer
    const customer = await db.customer.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!customer || !customer.passwordHash) {
      // Prevent timing attacks by performing a dummy hash comparison
      await verifyPassword(password, DUMMY_HASH)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await verifyPassword(password, customer.passwordHash)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Create session
    await createSession(customer.id, customer.email)

    // Get geo info for security alert
    const geo = await getGeoInfo()
    const userAgent = request.headers.get('user-agent') || ''
    const device = parseUserAgent(userAgent)
    const location = formatLocation(geo)

    // Send security alert
    await sendSecurityAlert({
      email: customer.email,
      type: 'login',
      ipAddress: geo.ip,
      location,
      device,
      timestamp: new Date(),
    })

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
