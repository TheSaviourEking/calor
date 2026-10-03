import { SignJWT, jwtVerify } from 'jose'

// Short-lived identity token passed from the web app to the socket services in
// the Socket.io handshake. The services are on another origin, so the session
// cookie never reaches them. This file must stay dependency-light: it is
// compiled into both service binaries and imported by the Next.js app.

export interface RealtimeUser {
  customerId: string
  isAdmin: boolean
  hostId: string | null
}

const ISSUER = 'calor-web'
const AUDIENCE = 'calor-realtime'

export async function signRealtimeToken(
  user: RealtimeUser,
  secret: string,
  ttlSeconds = 300
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)

  return new SignJWT({ customerId: user.customerId, isAdmin: user.isAdmin, hostId: user.hostId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt(now)
    .setExpirationTime(now + ttlSeconds)
    .sign(new TextEncoder().encode(secret))
}

// Returns null for anything that is not a valid, unexpired token for this
// audience. Callers treat null as "anonymous", never as an error.
export async function verifyRealtimeToken(
  token: unknown,
  secret: string | undefined
): Promise<RealtimeUser | null> {
  if (typeof token !== 'string' || !token || !secret) return null

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      issuer: ISSUER,
      audience: AUDIENCE,
    })
    if (typeof payload.customerId !== 'string' || !payload.customerId) return null

    return {
      customerId: payload.customerId,
      isAdmin: payload.isAdmin === true,
      hostId: typeof payload.hostId === 'string' ? payload.hostId : null,
    }
  } catch {
    return null
  }
}
