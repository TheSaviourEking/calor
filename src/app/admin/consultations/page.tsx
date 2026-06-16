import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { serialise } from '@/lib/serialise'
import AdminConsultationsClient from './AdminConsultationsClient'

export const dynamic = 'force-dynamic'

export default async function AdminConsultationsPage() {
  const session = await getSession()
  if (!session) redirect('/account')

  const [consultants, bookings] = await Promise.all([
    db.consultant.findMany({
      include: {
        availability: true,
        _count: { select: { bookings: true, reviews: true } },
      },
      orderBy: { name: 'asc' },
    }),
    db.consultationBooking.findMany({
      include: {
        consultant: { select: { name: true } },
        customer: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { scheduledAt: 'desc' },
      take: 100,
    }),
  ])

  return (
    <AdminConsultationsClient
      consultants={serialise(consultants) as any}
      bookings={serialise(bookings) as any}
    />
  )
}
