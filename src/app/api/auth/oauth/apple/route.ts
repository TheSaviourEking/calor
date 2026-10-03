import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomBytes } from 'crypto'
import { jwtVerify, SignJWT, importPKCS8, createRemoteJWKSet } from 'jose'
import { config } from '@/lib/config'
import { createSession } from '@/lib/auth/session'

// Apple publishes its signing keys as a JWK set. jose fetches and caches it,
// picks the key whose `kid` matches the token, and refetches on rotation.
const APPLE_KEYS = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'))

// Apple OAuth callback
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const idToken = formData.get('id_token') as string
    const _code = formData.get('code') as string
    const state = formData.get('state') as string
    const user = formData.get('user') as string | null

    if (!idToken) {
      return NextResponse.redirect(new URL('/account?error=no_token', request.url), 303)
    }

    // Validate OAuth state parameter to prevent CSRF
    const cookieStore = request.cookies
    const storedState = cookieStore.get('oauth_state')?.value
    if (!storedState || storedState !== state) {
      return NextResponse.redirect(new URL('/account?error=invalid_state', request.url), 303)
    }

    const appleClientId = process.env.APPLE_CLIENT_ID
    if (!appleClientId) {
      return NextResponse.redirect(new URL('/account?error=apple_not_configured', request.url), 303)
    }

    // Verify the Apple ID token. A token whose key id is not in Apple's
    // current key set fails verification — there is no fallback key.
    const { payload } = await jwtVerify(idToken, APPLE_KEYS, {
      issuer: 'https://appleid.apple.com',
      audience: appleClientId,
      algorithms: ['RS256'],
    })

    const appleUserId = payload.sub as string
    const appleEmail = payload.email as string
    // Apple sends this claim as a boolean or as the string "true"
    const emailVerified = payload.email_verified === true || payload.email_verified === 'true'

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

    // Create session using shared JWT-based session (same as email auth)
    await createSession(customer.id, customer.email)

    // Redirect to account — clear the oauth_state cookie
    const response = NextResponse.redirect(new URL('/account', request.url), 303)
    response.cookies.set('oauth_state', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 0,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Apple OAuth error:', error)
    return NextResponse.redirect(new URL('/account?error=oauth_failed', request.url), 303)
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
    const state = randomBytes(16).toString('hex')

    const authUrl = new URL('https://appleid.apple.com/auth/authorize')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code id_token')
    authUrl.searchParams.set('scope', 'email name')
    authUrl.searchParams.set('response_mode', 'form_post')
    authUrl.searchParams.set('state', state)

    // Store state in cookie for CSRF validation on callback
    // Note: clientSecret is server-side only — never expose it to the client
    const response = NextResponse.json({
      url: authUrl.toString(),
    })
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      // Apple returns with a cross-site form POST, which only carries
      // SameSite=None cookies (and those must be Secure).
      secure: true,
      sameSite: 'none',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Apple OAuth URL generation error:', error)
    return NextResponse.json({ error: 'Failed to generate auth URL' }, { status: 500 })
  }
}
