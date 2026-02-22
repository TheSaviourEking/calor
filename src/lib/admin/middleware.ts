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
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }
  return handler(auth.customerId!)
}
