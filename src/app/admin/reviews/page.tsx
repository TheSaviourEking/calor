import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { serialise } from '@/lib/serialise'
import AdminReviewsClient from './AdminReviewsClient'

export const dynamic = 'force-dynamic'

export default async function AdminReviewsPage() {
  const session = await getSession()
  if (!session) redirect('/account')

  const [pendingReviews, allReviews] = await Promise.all([
    db.review.findMany({
      where: { isApproved: false },
      include: {
        product: { select: { name: true, slug: true } },
        customer: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    db.review.findMany({
      where: { isApproved: true },
      include: {
        product: { select: { name: true, slug: true } },
        customer: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ])

  return (
    <AdminReviewsClient
      pendingReviews={serialise(pendingReviews) as any}
      approvedReviews={serialise(allReviews) as any}
    />
  )
}
