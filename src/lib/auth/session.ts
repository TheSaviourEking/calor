import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { config } from '@/lib/config'

const SECRET = new TextEncoder().encode(config.auth.jwtSecret)

export interface SessionPayload {
  customerId: string
  email: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as SessionPayload
  } catch {
    return null
  }
}

export async function createSession(customerId: string, email: string) {
  const token = await new SignJWT({ customerId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .setIssuedAt()
    .sign(SECRET)

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  // Store session in database
  await db.session.create({
    data: {
      customerId,
      token,
      expiresAt,
    },
  })

  const cookieStore = await cookies()
  cookieStore.set('calor_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })

  return token
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('calor_session')?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, SECRET)

    // Verify session exists in database
    const session = await db.session.findUnique({
      where: { token },
      include: { customer: true },
    })

    if (!session || session.expiresAt < new Date()) {
      return null
    }

    return payload as SessionPayload
  } catch {
    return null
  }
}

export async function destroySession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('calor_session')?.value

  if (token) {
    // Remove from database
    await db.session.deleteMany({
      where: { token },
    }).catch(() => { })
  }

  cookieStore.delete('calor_session')
}

export async function getCustomerFromSession() {
  const session = await getSession()
  if (!session) return null

  return db.customer.findUnique({
    where: { id: session.customerId },
    include: {
      addresses: true,
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })
}
