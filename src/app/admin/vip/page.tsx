import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { serialise } from '@/lib/serialise'
import AdminVIPClient from './AdminVIPClient'

export const dynamic = 'force-dynamic'

export default async function AdminVIPPage() {
  const session = await getSession()
  if (!session) redirect('/account')

  const tiers = await db.vIPTier.findMany({
    include: {
      benefits: { orderBy: { sortOrder: 'asc' } },
      _count: { select: { customers: true } },
    },
    orderBy: { level: 'asc' },
  })

  return <AdminVIPClient initialTiers={serialise(tiers) as any} />
}
