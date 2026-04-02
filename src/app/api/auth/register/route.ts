import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, createSession } from '@/lib/auth/session'
import { sendVerificationEmail, sendSecurityAlert } from '@/lib/email'
import { getGeoInfo, parseUserAgent, formatLocation } from '@/lib/geo'
import { rateLimitByIp } from '@/lib/rate-limit'
import crypto from 'crypto'

import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 3 registrations per minute per IP
    const rl = await rateLimitByIp(request, 'auth:register', { windowMs: 60_000, maxRequests: 3 })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      )
    }

    const rawBody = await request.json()
    const parsed = registerSchema.safeParse(rawBody)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, password, firstName, lastName } = parsed.data

    // Check if customer exists
    const existing = await db.customer.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Generate email verification token
    const verifyToken = crypto.randomBytes(32).toString('hex')
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create customer
    const customer = await db.customer.create({
      data: {
        email: email.toLowerCase(),
        firstName,
        lastName,
        passwordHash,
        ageVerifiedAt: new Date(),
        emailVerifyToken: verifyToken,
        emailVerifyExpires: verifyExpires,
      },
    })

    // Create session
    await createSession(customer.id, customer.email)

    // Get geo info for security alert
    const geo = await getGeoInfo()
    const userAgent = request.headers.get('user-agent') || ''
    const device = parseUserAgent(userAgent)
    const location = formatLocation(geo)

    // Send verification email
    await sendVerificationEmail({
      email: customer.email,
      customerName: customer.firstName,
      verifyToken,
    })

    // Send security alert about new account
    await sendSecurityAlert({
      email: customer.email,
      type: 'account_update',
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
        emailVerified: false,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
