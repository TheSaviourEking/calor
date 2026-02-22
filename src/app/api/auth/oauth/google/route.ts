import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomBytes } from 'crypto'
import { config } from '@/lib/config'

// Google OAuth callback
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL(`/account?error=${error}`, request.url))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/account?error=no_code', request.url))
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '', // Deliberately leaving optional OAuth env vars as process.env 
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: `${config.app.baseUrl}/api/auth/oauth/google`,
        grant_type: 'authorization_code',
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenData.access_token) {
      throw new Error('Failed to get access token')
    }

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    const googleUser = await userResponse.json()

    if (!googleUser.id || !googleUser.email) {
      throw new Error('Failed to get user info')
    }

    // Check if customer exists with Google ID
    let customer = await db.customer.findUnique({
      where: { googleId: googleUser.id }
    })

    if (!customer) {
      // Check if customer exists with same email
      customer = await db.customer.findUnique({
        where: { email: googleUser.email }
      })

      if (customer) {
        // Link Google account to existing customer
        customer = await db.customer.update({
          where: { id: customer.id },
          data: {
            googleId: googleUser.id,
            googleEmail: googleUser.email,
            authProvider: 'google',
            emailVerified: true,
            emailVerifiedAt: new Date(),
          }
        })
      } else {
        // Create new customer
        const nameParts = googleUser.name?.split(' ') || ['', '']
        customer = await db.customer.create({
          data: {
            email: googleUser.email,
            firstName: nameParts[0] || googleUser.given_name || 'User',
            lastName: nameParts.slice(1).join(' ') || googleUser.family_name || '',
            googleId: googleUser.id,
            googleEmail: googleUser.email,
            authProvider: 'google',
            emailVerified: true,
            emailVerifiedAt: new Date(),
          }
        })
      }
    }

    // Create session
    const sessionToken = randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // 30 days

    await db.session.create({
      data: {
        customerId: customer.id,
        token: sessionToken,
        expiresAt,
      }
    })

    // Redirect to account with session cookie
    const response = NextResponse.redirect(new URL('/account', request.url))
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Google OAuth error:', error)
    return NextResponse.redirect(new URL('/account?error=oauth_failed', request.url))
  }
}

// Generate Google OAuth URL
export async function POST(request: NextRequest) {
  const { redirectUrl } = await request.json().catch(() => ({}))

  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'Google OAuth not configured' }, { status: 500 })
  }

  const redirectUri = `${config.app.baseUrl}/api/auth/oauth/google`
  const state = randomBytes(16).toString('hex')

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'email profile')
  authUrl.searchParams.set('state', state)

  if (redirectUrl) {
    authUrl.searchParams.set('access_type', 'offline')
  }

  return NextResponse.json({ url: authUrl.toString() })
}
