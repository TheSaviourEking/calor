import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { serialise } from '@/lib/serialise'
import AdminPromotionsClient from './AdminPromotionsClient'

export const dynamic = 'force-dynamic'

export default async function AdminPromotionsPage() {
  const session = await getSession()
  if (!session) redirect('/account')

  const promotions = await db.promotion.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return <AdminPromotionsClient initialPromotions={serialise(promotions) as any} />
}
