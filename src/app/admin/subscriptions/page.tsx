import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { serialise } from '@/lib/serialise'
import AdminSubscriptionsClient from './AdminSubscriptionsClient'

export const dynamic = 'force-dynamic'

export default async function AdminSubscriptionsPage() {
  const session = await getSession()
  if (!session) redirect('/account')

  const [subscriptions, plans] = await Promise.all([
    db.subscription.findMany({
      include: {
        plan: { select: { id: true, name: true, priceCents: true, interval: true } },
        customer: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.subscriptionPlan.findMany({ orderBy: { sortOrder: 'asc' } }),
  ])

  return (
    <AdminSubscriptionsClient
      initialSubscriptions={serialise(subscriptions) as any}
      plans={serialise(plans) as any}
    />
  )
}
