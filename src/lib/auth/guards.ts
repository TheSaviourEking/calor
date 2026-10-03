import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'

// Route guards. Call one as the first statement of a handler:
//
//   const auth = await requireCustomer()
//   if (!auth.ok) return auth.response
//
// Identity always comes from the session cookie, never from the request.

export type GuardResult<T> = ({ ok: true } & T) | { ok: false; response: NextResponse }

function deny(status: 401 | 403 | 404, error: string): { ok: false; response: NextResponse } {
  return { ok: false, response: NextResponse.json({ error }, { status }) }
}

async function loadRoles(customerId: string) {
  const customer = await db.customer.findUnique({
    where: { id: customerId },
    select: { isAdmin: true, isHost: true },
  })
  return { isAdmin: customer?.isAdmin ?? false, isHost: customer?.isHost ?? false }
}

export async function requireCustomer(): Promise<GuardResult<{ customerId: string }>> {
  const session = await getSession()
  if (!session?.customerId) return deny(401, 'Unauthorized')

  return { ok: true, customerId: session.customerId }
}

export async function requireAdminUser(): Promise<GuardResult<{ customerId: string }>> {
  const session = await getSession()
  if (!session?.customerId) return deny(401, 'Unauthorized')

  const { isAdmin } = await loadRoles(session.customerId)
  if (!isAdmin) return deny(403, 'Admin access required')

  return { ok: true, customerId: session.customerId }
}

// Admins and designated hosts. hostId is the caller's StreamHost profile, if any.
export async function requireHostProfile(): Promise<
  GuardResult<{ customerId: string; isAdmin: boolean; hostId: string | null }>
> {
  const session = await getSession()
  if (!session?.customerId) return deny(401, 'Unauthorized')

  const { isAdmin, isHost } = await loadRoles(session.customerId)
  if (!isAdmin && !isHost) return deny(403, 'Host access required')

  const host = await db.streamHost.findUnique({
    where: { customerId: session.customerId },
    select: { id: true },
  })

  return { ok: true, customerId: session.customerId, isAdmin, hostId: host?.id ?? null }
}

// The host who owns the stream, or any admin.
export async function requireStreamOwner(
  streamId: string
): Promise<GuardResult<{ customerId: string; isAdmin: boolean }>> {
  const session = await getSession()
  if (!session?.customerId) return deny(401, 'Unauthorized')

  const stream = await db.liveStream.findUnique({
    where: { id: streamId },
    select: { host: { select: { customerId: true } } },
  })
  if (!stream) return deny(404, 'Stream not found')

  const { isAdmin } = await loadRoles(session.customerId)
  if (!isAdmin && stream.host.customerId !== session.customerId) {
    return deny(403, 'You do not manage this stream')
  }

  return { ok: true, customerId: session.customerId, isAdmin }
}
