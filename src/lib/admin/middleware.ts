import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function requireAdmin() {
  const session = await getSession()
  if (!session) {
    return { authorized: false, error: 'Unauthorized' }
  }

  const customer = await db.customer.findUnique({
    where: { id: session.customerId },
    select: { isAdmin: true },
  })

  if (!customer?.isAdmin) {
    return { authorized: false, error: 'Admin access required' }
  }

  return { authorized: true, customerId: session.customerId }
}

export async function adminApiHandler(
  request: NextRequest,
  handler: (customerId: string) => Promise<NextResponse>
) {
  const auth = await requireAdmin()
  if (!auth.authorized) {
    // 401 = not authenticated, 403 = authenticated but not permitted
    const session = await getSession()
    const status = session ? 403 : 401
    return NextResponse.json({ error: auth.error }, { status })
  }
  return handler(auth.customerId!)
}
