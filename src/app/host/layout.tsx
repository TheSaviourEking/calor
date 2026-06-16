import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import HostLayoutClient from './HostLayoutClient'

/**
 * Host Studio is restricted to:
 *   - Admins (isAdmin: true) — always have host access
 *   - Designated hosts (isHost: true) — granted by admin
 *
 * Any other authenticated customer will be redirected to their account.
 * Unauthenticated users are redirected to login.
 */
export default async function HostLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect('/account')
  }

  const customer = await db.customer.findUnique({
    where: { id: session.customerId },
    select: { isAdmin: true, isHost: true },
  })

  // Must be admin or explicitly granted host access
  if (!customer?.isAdmin && !customer?.isHost) {
    redirect('/account')
  }

  return <HostLayoutClient>{children}</HostLayoutClient>
}
