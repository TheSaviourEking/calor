import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin/middleware'
import AdminCustomersClient from './AdminCustomersClient'

async function getCustomersWithStats() {
  const customers = await db.customer.findMany({
    include: {
      orders: {
        select: {
          id: true,
          totalCents: true,
          status: true,
          createdAt: true,
        },
      },
      loyaltyAccount: true,
      _count: {
        select: {
          orders: true,
          sessions: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return customers
}

export default async function AdminCustomersPage() {
  await requireAdmin()
  const customers = await getCustomersWithStats()

  return <AdminCustomersClient initialCustomers={customers} />
}
