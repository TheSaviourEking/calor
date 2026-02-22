import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomBytes } from 'crypto'
import { jwtVerify, SignJWT, importPKCS8, importX509 } from 'jose'
import { config } from '@/lib/config'

// Apple OAuth callback
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const idToken = formData.get('id_token') as string
    const code = formData.get('code') as string
    const state = formData.get('state') as string
    const user = formData.get('user') as string | null

    if (!idToken) {
      return NextResponse.redirect(new URL('/account?error=no_token', request.url))
    }

    // Verify Apple ID token
    const applePublicKey = await getApplePublicKey()
    const { payload } = await jwtVerify(idToken, applePublicKey, {
      issuer: 'https://appleid.apple.com',
      audience: process.env.APPLE_CLIENT_ID || '',
    })

    const appleUserId = payload.sub as string
    const appleEmail = payload.email as string
    const emailVerified = payload.email_verified === 'true'

    // Parse user info if provided (first sign in)
    let firstName = 'User'
    let lastName = ''
    if (user) {
      try {
        const userData = JSON.parse(user)
        firstName = userData.name?.firstName || firstName
        lastName = userData.name?.lastName || ''
      } catch {
        // Ignore parse errors
      }
    }

    // Check if customer exists with Apple ID
    let customer = await db.customer.findUnique({
      where: { appleId: appleUserId }
    })

    if (!customer) {
      // Check if customer exists with same email
      customer = await db.customer.findUnique({
        where: { email: appleEmail }
      })

      if (customer) {
        // Link Apple account to existing customer
        customer = await db.customer.update({
          where: { id: customer.id },
          data: {
            appleId: appleUserId,
            appleEmail: appleEmail,
            authProvider: 'apple',
            emailVerified: emailVerified,
            emailVerifiedAt: emailVerified ? new Date() : customer.emailVerifiedAt,
          }
        })
      } else {
        // Create new customer
        customer = await db.customer.create({
          data: {
            email: appleEmail,
            firstName,
            lastName,
            appleId: appleUserId,
            appleEmail: appleEmail,
            authProvider: 'apple',
            emailVerified: emailVerified,
            emailVerifiedAt: emailVerified ? new Date() : undefined,
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
    console.error('Apple OAuth error:', error)
    return NextResponse.redirect(new URL('/account?error=oauth_failed', request.url))
  }
}

// Generate Apple OAuth URL
export async function GET(request: NextRequest) {
  const clientId = process.env.APPLE_CLIENT_ID
  const teamId = process.env.APPLE_TEAM_ID
  const keyId = process.env.APPLE_KEY_ID
  const privateKey = process.env.APPLE_PRIVATE_KEY

  if (!clientId || !teamId || !keyId || !privateKey) {
    return NextResponse.json({ error: 'Apple OAuth not configured' }, { status: 500 })
  }

  try {
    // Create client secret (JWT)
    const now = Math.floor(Date.now() / 1000)
    const clientSecret = await new SignJWT({})
      .setProtectedHeader({ alg: 'ES256', kid: keyId })
      .setIssuedAt(now)
      .setExpirationTime(now + 3600) // 1 hour
      .setIssuer(teamId)
      .setAudience('https://appleid.apple.com')
      .setSubject(clientId)
      .sign(await importPKCS8(privateKey.replace(/\\n/g, '\n'), 'ES256'))

    const redirectUri = `${config.app.baseUrl}/api/auth/oauth/apple`

    const authUrl = new URL('https://appleid.apple.com/auth/authorize')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code id_token')
    authUrl.searchParams.set('scope', 'email name')
    authUrl.searchParams.set('response_mode', 'form_post')
    authUrl.searchParams.set('state', randomBytes(16).toString('hex'))

    return NextResponse.json({
      url: authUrl.toString(),
      clientSecret
    })
  } catch (error) {
    console.error('Apple OAuth URL generation error:', error)
    return NextResponse.json({ error: 'Failed to generate auth URL' }, { status: 500 })
  }
}

// Helper to get Apple's public key for token verification
async function getApplePublicKey() {
  const response = await fetch('https://appleid.apple.com/auth/keys')
  const data = await response.json()
  const key = data.keys[0] // Use the first key

  return await importX509(
    `-----BEGIN CERTIFICATE-----\n${key.x5c[0]}\n-----END CERTIFICATE-----`,
    'RS256'
  )
}
