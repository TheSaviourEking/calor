import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { serialise } from '@/lib/serialise'
import AdminGiftCardsClient from './AdminGiftCardsClient'

export const dynamic = 'force-dynamic'

export default async function AdminGiftCardsPage() {
  const session = await getSession()
  if (!session) redirect('/account')

  const giftCards = await db.giftCard.findMany({
    include: {
      purchaser: { select: { firstName: true, lastName: true, email: true } },
      transactions: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return <AdminGiftCardsClient initialGiftCards={serialise(giftCards) as any} />
}
