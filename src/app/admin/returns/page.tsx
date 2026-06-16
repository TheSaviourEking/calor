import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { serialise } from '@/lib/serialise'
import AdminReturnsClient from './AdminReturnsClient'

export const dynamic = 'force-dynamic'

export default async function AdminReturnsPage() {
  const session = await getSession()
  if (!session) redirect('/account')

  const returns = await db.returnRequest.findMany({
    include: {
      order: {
        select: { reference: true, totalCents: true, createdAt: true },
      },
      customer: {
        select: { firstName: true, lastName: true, email: true },
      },
      items: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return <AdminReturnsClient returns={serialise(returns) as any} />
}
