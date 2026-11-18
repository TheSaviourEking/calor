import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { requireCustomer } from '@/lib/auth/guards'

// POST /api/sessions/revoke-others - sign out every other device, keep this one
export async function POST() {
  const auth = await requireCustomer()
  if (!auth.ok) return auth.response

  const cookieStore = await cookies()
  const currentToken = cookieStore.get('calor_session')?.value
  if (!currentToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { count } = await db.session.deleteMany({
    where: { customerId: auth.customerId, token: { not: currentToken } },
  })

  return NextResponse.json({ revoked: count })
}
